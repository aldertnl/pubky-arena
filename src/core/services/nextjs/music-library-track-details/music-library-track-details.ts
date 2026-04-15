import {
  ErrorService,
  HttpMethod,
  httpResponseToError,
  parseResponseOrThrow,
  safeFetch,
} from '@/libs';
import type {
  TMusicLibraryTrackDetailsParams,
  TMusicLibraryTrackDetailsResult,
} from '@/core/application/music-library-track-details/music-library-track-details.types';

const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2/recording';

const REQUEST_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'Pubky App/1.0 (https://github.com/synonymdev/pubky-app)',
};

interface MusicBrainzRecordingLookupResponse {
  releases?: Array<{
    title?: string;
    date?: string;
  }>;
  genres?: Array<{
    name?: string;
    count?: number;
  }>;
  tags?: Array<{
    name?: string;
    count?: number;
  }>;
  'artist-credit'?: Array<{
    name?: string;
    joinphrase?: string;
    artist?: {
      name?: string;
    };
  }>;
  'first-release-date'?: string;
}

export class NextJsMusicLibraryTrackDetailsService {
  private constructor() {}

  static async fetch({ recordingId }: TMusicLibraryTrackDetailsParams): Promise<TMusicLibraryTrackDetailsResult> {
    const searchParams = new URLSearchParams({
      inc: 'releases+genres+tags',
      fmt: 'json',
    });
    const url = `${MUSICBRAINZ_BASE_URL}/${recordingId}?${searchParams.toString()}`;

    const response = await safeFetch(
      url,
      { method: HttpMethod.GET, headers: REQUEST_HEADERS },
      ErrorService.NextJsServer,
      'fetchMusicTrackDetails',
    );

    if (!response.ok) {
      throw httpResponseToError(response, ErrorService.NextJsServer, 'fetchMusicTrackDetails', url);
    }

    const data = await parseResponseOrThrow<MusicBrainzRecordingLookupResponse>(
      response,
      ErrorService.NextJsServer,
      'fetchMusicTrackDetails',
      url,
    );

    return {
      artist: formatArtistCredit(data['artist-credit']),
      album: data.releases?.find((release) => release.title?.trim())?.title?.trim() ?? null,
      year: getYear(data),
      genre: getGenre(data),
    };
  }
}

function formatArtistCredit(credits: MusicBrainzRecordingLookupResponse['artist-credit']): string {
  if (!credits?.length) {
    return '';
  }

  return credits
    .map((credit) => `${credit.artist?.name ?? credit.name ?? ''}${credit.joinphrase ?? ''}`)
    .join('')
    .trim();
}

function getYear(recording: MusicBrainzRecordingLookupResponse): string | null {
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

function getGenre(recording: MusicBrainzRecordingLookupResponse): string | null {
  const primaryGenre =
    recording.genres
      ?.slice()
      .sort((left, right) => (right.count ?? 0) - (left.count ?? 0))
      .find((genre) => genre.name?.trim())
      ?.name?.trim() ?? null;

  if (primaryGenre) {
    return primaryGenre;
  }

  return (
    recording.tags
      ?.slice()
      .sort((left, right) => (right.count ?? 0) - (left.count ?? 0))
      .find((tag) => tag.name?.trim())
      ?.name?.trim() ?? null
  );
}
