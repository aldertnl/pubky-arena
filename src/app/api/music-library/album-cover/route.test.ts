import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import * as Core from '@/core';
import * as Libs from '@/libs';

const createRequest = ({ artist, album }: { artist?: string; album?: string }) => {
  const searchParams = new URLSearchParams();

  if (artist !== undefined) {
    searchParams.set('artist', artist);
  }

  if (album !== undefined) {
    searchParams.set('album', album);
  }

  const query = searchParams.toString();
  return new NextRequest(`http://localhost:3000/api/music-library/album-cover${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
};

describe('API Route: /api/music-library/album-cover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Core.MusicLibraryAlbumCoverController, 'fetch').mockResolvedValue({
      imageUrl: 'https://coverartarchive.org/release-group/test/front-500.jpg',
    });
  });

  it('returns album cover data with cache headers on success', async () => {
    const response = await GET(createRequest({ artist: 'Burial', album: 'Untrue' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      imageUrl: 'https://coverartarchive.org/release-group/test/front-500.jpg',
    });
    expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=86400, stale-while-revalidate=604800');
  });

  it('passes artist and album query params to controller', async () => {
    const fetchSpy = vi.spyOn(Core.MusicLibraryAlbumCoverController, 'fetch');

    await GET(createRequest({ artist: 'Nujabes', album: 'Modal Soul' }));

    expect(fetchSpy).toHaveBeenCalledWith({
      artist: 'Nujabes',
      album: 'Modal Soul',
    });
  });

  it('passes artist-only params to controller when album is missing', async () => {
    const fetchSpy = vi.spyOn(Core.MusicLibraryAlbumCoverController, 'fetch');

    await GET(createRequest({ artist: 'Burial' }));

    expect(fetchSpy).toHaveBeenCalledWith({
      artist: 'Burial',
      album: undefined,
    });
  });

  it('returns 400 when artist is missing', async () => {
    const appError = Libs.Err.validation(Libs.ValidationErrorCode.MISSING_FIELD, 'Artist is required.', {
      service: Libs.ErrorService.NextJsServer,
      operation: 'validateMusicLibraryAlbumCover',
      context: { field: 'artist', statusCode: Libs.HttpStatusCode.BAD_REQUEST },
    });
    vi.spyOn(Core.MusicLibraryAlbumCoverController, 'fetch').mockRejectedValue(appError);

    const response = await GET(createRequest({ album: 'Untrue' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Artist is required.');
  });

  it('returns 500 for unexpected errors', async () => {
    vi.spyOn(Core.MusicLibraryAlbumCoverController, 'fetch').mockRejectedValue(new Error('Unexpected failure'));

    const response = await GET(createRequest({ artist: 'Burial', album: 'Untrue' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch album cover');
  });
});
