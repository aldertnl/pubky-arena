import {
  Err,
  ErrorService,
  HttpMethod,
  HttpStatusCode,
  ServerErrorCode,
  ValidationErrorCode,
  safeFetch,
  httpResponseToError,
  parseResponseOrThrow,
} from '@/libs';
import type { TMusicLibraryAlbumCoverParams, TMusicLibraryAlbumCoverResult } from '@/core/application/music-library-cover/music-library-cover.types';

const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2/release-group';
const COVER_ART_ARCHIVE_BASE_URL = 'https://coverartarchive.org/release-group';
const SEARCH_LIMIT = 5;

const REQUEST_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'Pubky App/1.0 (https://github.com/synonymdev/pubky-app)',
};

interface MusicBrainzSearchResponse {
  'release-groups'?: MusicBrainzReleaseGroup[];
}

interface MusicBrainzReleaseGroup {
  id: string;
  title: string;
  'primary-type'?: string;
  'secondary-types'?: string[];
  'artist-credit'?: Array<{
    name?: string;
    artist?: {
      name?: string;
    };
  }>;
  releases?: Array<{
    status?: string;
  }>;
}

interface CoverArtArchiveResponse {
  images?: Array<{
    image?: string;
    front?: boolean;
    thumbnails?: {
      small?: string;
      large?: string;
      '250'?: string;
      '500'?: string;
      '1200'?: string;
    };
  }>;
}

export class NextJsMusicLibraryAlbumCoverService {
  private constructor() {}

  static async fetch({ artist, album }: TMusicLibraryAlbumCoverParams): Promise<TMusicLibraryAlbumCoverResult> {
    const releaseGroupIds = await this.searchReleaseGroupIds({ artist, album });
    const imageUrl = await this.findFirstAvailableCoverArtUrl(releaseGroupIds);

    return {
      imageUrl,
    };
  }

  private static async searchReleaseGroupIds({ artist, album }: TMusicLibraryAlbumCoverParams): Promise<string[]> {
    const query = buildMusicBrainzQuery({ artist, album });
    const searchParams = new URLSearchParams({
      query,
      fmt: 'json',
      limit: SEARCH_LIMIT.toString(),
    });
    const url = `${MUSICBRAINZ_BASE_URL}?${searchParams.toString()}`;

    const response = await safeFetch(url, { method: HttpMethod.GET, headers: REQUEST_HEADERS }, ErrorService.NextJsServer, 'searchMusicReleaseGroup');

    if (!response.ok) {
      throw httpResponseToError(response, ErrorService.NextJsServer, 'searchMusicReleaseGroup', url);
    }

    const data = await parseResponseOrThrow<MusicBrainzSearchResponse>(
      response,
      ErrorService.NextJsServer,
      'searchMusicReleaseGroup',
      url,
    );

    const releaseGroups = data['release-groups'];
    if (!Array.isArray(releaseGroups) || releaseGroups.length === 0) {
      return [];
    }

    return releaseGroups
      .map((releaseGroup) => ({
        releaseGroup,
        score: getReleaseGroupScore(releaseGroup, artist, album),
      }))
      .sort((left, right) => right.score - left.score)
      .filter((candidate) => candidate.score > 0)
      .map((candidate) => candidate.releaseGroup.id);
  }

  private static async findFirstAvailableCoverArtUrl(releaseGroupIds: string[]): Promise<string | null> {
    for (const releaseGroupId of releaseGroupIds) {
      const imageUrl = await this.fetchCoverArtUrl(releaseGroupId);
      if (imageUrl) {
        return imageUrl;
      }
    }

    return null;
  }

  private static async fetchCoverArtUrl(releaseGroupId: string): Promise<string | null> {
    const url = `${COVER_ART_ARCHIVE_BASE_URL}/${releaseGroupId}`;
    const response = await safeFetch(url, { method: HttpMethod.GET, headers: REQUEST_HEADERS }, ErrorService.NextJsServer, 'fetchMusicAlbumCover');

    if (response.status === HttpStatusCode.NOT_FOUND) {
      return null;
    }

    if (!response.ok) {
      throw httpResponseToError(response, ErrorService.NextJsServer, 'fetchMusicAlbumCover', url);
    }

    const data = await parseResponseOrThrow<CoverArtArchiveResponse>(
      response,
      ErrorService.NextJsServer,
      'fetchMusicAlbumCover',
      url,
    );

    if (!Array.isArray(data.images) || data.images.length === 0) {
      return null;
    }

    const cover = data.images.find((image) => image.front) ?? data.images[0];
    const rawUrl =
      cover?.thumbnails?.large ?? cover?.thumbnails?.['500'] ?? cover?.thumbnails?.small ?? cover?.image ?? null;

    return normalizeCoverArtUrl(rawUrl);
  }
}

function getReleaseGroupScore(releaseGroup: MusicBrainzReleaseGroup, artist: string, album?: string): number {
  const normalizedArtist = normalizeSearchValue(artist);
  const normalizedAlbum = album ? normalizeSearchValue(album) : null;
  const normalizedTitle = normalizeSearchValue(releaseGroup.title);
  const releaseGroupArtists = (releaseGroup['artist-credit'] ?? [])
    .map((credit) => normalizeSearchValue(credit.artist?.name ?? credit.name ?? ''))
    .filter(Boolean);

  let score = 0;

  if (normalizedAlbum) {
    if (normalizedTitle === normalizedAlbum) {
      score += 100;
    } else if (normalizedTitle.includes(normalizedAlbum) || normalizedAlbum.includes(normalizedTitle)) {
      score += 40;
    }
  }

  if (releaseGroupArtists.some((name) => name === normalizedArtist)) {
    score += 100;
  } else if (releaseGroupArtists.some((name) => name.includes(normalizedArtist) || normalizedArtist.includes(name))) {
    score += 40;
  }

  if (releaseGroup['primary-type'] === 'Album') {
    score += 30;
  }

  if ((releaseGroup['secondary-types'] ?? []).includes('Compilation')) {
    score -= 20;
  }

  if ((releaseGroup['secondary-types'] ?? []).includes('Live')) {
    score -= 20;
  }

  if ((releaseGroup.releases ?? []).some((release) => release.status === 'Official')) {
    score += 20;
  }

  return score;
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildMusicBrainzQuery({ artist, album }: TMusicLibraryAlbumCoverParams): string {
  const artistQuery = `artist:"${safeSearchValue(artist)}"`;

  if (!album) {
    return artistQuery;
  }

  return `releasegroup:"${safeSearchValue(album)}" AND ${artistQuery}`;
}

function safeSearchValue(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw Err.validation(ValidationErrorCode.INVALID_INPUT, 'MusicBrainz search value cannot be empty.', {
      service: ErrorService.NextJsServer,
      operation: 'safeSearchValue',
      context: { statusCode: HttpStatusCode.BAD_REQUEST },
    });
  }

  const escaped = trimmed.replace(/"/g, '\\"');
  if (!escaped) {
    throw Err.server(ServerErrorCode.INVALID_RESPONSE, 'Failed to build MusicBrainz search query.', {
      service: ErrorService.NextJsServer,
      operation: 'safeSearchValue',
      context: { statusCode: HttpStatusCode.BAD_REQUEST },
    });
  }

  return escaped;
}

function normalizeCoverArtUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  if (url.startsWith('http://coverartarchive.org/')) {
    return `https://${url.slice('http://'.length)}`;
  }

  return url;
}
