import {
  ErrorService,
  HttpMethod,
  httpResponseToError,
  parseResponseOrThrow,
  safeFetch,
  ServerErrorCode,
  Err,
} from '@/libs';
import type {
  TMusicLibraryTrackAutocompleteParams,
  TMusicLibraryTrackAutocompleteResult,
  TMusicLibraryTrackSuggestion,
} from '@/core/application/music-library-track-autocomplete/music-library-track-autocomplete.types';

const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2/recording';

const REQUEST_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'Pubky App/1.0 (https://github.com/synonymdev/pubky-app)',
};

interface MusicBrainzRecordingSearchResponse {
  recordings?: MusicBrainzRecording[];
}

interface MusicBrainzRecording {
  id?: string;
  title?: string;
  score?: number | string;
  'first-release-date'?: string;
  releases?: Array<{
    title?: string;
    date?: string;
  }>;
  'artist-credit'?: Array<{
    name?: string;
    joinphrase?: string;
    artist?: {
      name?: string;
    };
  }>;
}

export class NextJsMusicLibraryTrackAutocompleteService {
  private constructor() {}

  static async fetch({
    query,
    limit,
  }: TMusicLibraryTrackAutocompleteParams): Promise<TMusicLibraryTrackAutocompleteResult> {
    const searchParams = new URLSearchParams({
      query: buildMusicBrainzTrackQuery(query),
      fmt: 'json',
      limit: limit.toString(),
    });
    const url = `${MUSICBRAINZ_BASE_URL}?${searchParams.toString()}`;

    const response = await safeFetch(
      url,
      { method: HttpMethod.GET, headers: REQUEST_HEADERS },
      ErrorService.NextJsServer,
      'searchMusicTracks',
    );

    if (!response.ok) {
      throw httpResponseToError(response, ErrorService.NextJsServer, 'searchMusicTracks', url);
    }

    const data = await parseResponseOrThrow<MusicBrainzRecordingSearchResponse>(
      response,
      ErrorService.NextJsServer,
      'searchMusicTracks',
      url,
    );

    const suggestions = (data.recordings ?? [])
      .slice()
      .sort((left, right) => getSearchScore(right) - getSearchScore(left))
      .map(mapRecordingToSuggestion)
      .filter((suggestion): suggestion is TMusicLibraryTrackSuggestion => suggestion !== null);

    return {
      suggestions,
    };
  }
}

function getSearchScore(recording: MusicBrainzRecording): number {
  const rawScore = recording.score;
  const score = typeof rawScore === 'string' ? Number(rawScore) : rawScore;
  return Number.isFinite(score) ? score : 0;
}

function mapRecordingToSuggestion(recording: MusicBrainzRecording): TMusicLibraryTrackSuggestion | null {
  const id = recording.id?.trim();
  const track = recording.title?.trim();

  if (!id || !track) {
    return null;
  }

  return {
    id,
    track,
    artist: formatArtistCredit(recording['artist-credit']),
    album: recording.releases?.find((release) => release.title?.trim())?.title?.trim() ?? null,
    year: getSuggestionYear(recording),
  };
}

function formatArtistCredit(credits: MusicBrainzRecording['artist-credit']): string {
  if (!credits?.length) {
    return '';
  }

  return credits
    .map((credit) => `${credit.artist?.name ?? credit.name ?? ''}${credit.joinphrase ?? ''}`)
    .join('')
    .trim();
}

function buildMusicBrainzTrackQuery(query: string): string {
  const escaped = query.trim().replace(/"/g, '\\"');

  if (!escaped) {
    throw Err.server(ServerErrorCode.INVALID_RESPONSE, 'Failed to build MusicBrainz track search query.', {
      service: ErrorService.NextJsServer,
      operation: 'buildMusicBrainzTrackQuery',
    });
  }

  return `(recording:"${escaped}" OR artist:"${escaped}" OR release:"${escaped}")`;
}

function getSuggestionYear(recording: MusicBrainzRecording): string | null {
  const directYear = extractYear(recording['first-release-date']);
  if (directYear) {
    return directYear;
  }

  for (const release of recording.releases ?? []) {
    const releaseYear = extractYear(release.date);
    if (releaseYear) {
      return releaseYear;
    }
  }

  return null;
}

function extractYear(value?: string): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/^\d{4}/);
  return match ? match[0] : null;
}
