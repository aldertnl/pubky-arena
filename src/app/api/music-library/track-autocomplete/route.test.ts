import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import * as Core from '@/core';
import * as Libs from '@/libs';

const createRequest = ({ query }: { query?: string }) => {
  const searchParams = new URLSearchParams();

  if (query !== undefined) {
    searchParams.set('query', query);
  }

  const encodedQuery = searchParams.toString();
  return new NextRequest(
    `http://localhost:3000/api/music-library/track-autocomplete${encodedQuery ? `?${encodedQuery}` : ''}`,
    {
      method: 'GET',
    },
  );
};

describe('API Route: /api/music-library/track-autocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Core.MusicLibraryTrackAutocompleteController, 'fetch').mockResolvedValue({
      suggestions: [
        {
          id: 'track-1',
          track: 'Feather',
          artist: 'Nujabes feat. Cise Starr',
          album: 'Modal Soul',
          year: '2005',
        },
      ],
    });
  });

  it('returns track suggestions with cache headers on success', async () => {
    const response = await GET(createRequest({ query: 'fea' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      suggestions: [
        {
          id: 'track-1',
          track: 'Feather',
          artist: 'Nujabes feat. Cise Starr',
          album: 'Modal Soul',
          year: '2005',
        },
      ],
    });
    expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=3600, stale-while-revalidate=86400');
  });

  it('passes the query param to the controller', async () => {
    const fetchSpy = vi.spyOn(Core.MusicLibraryTrackAutocompleteController, 'fetch');

    await GET(createRequest({ query: 'luv' }));

    expect(fetchSpy).toHaveBeenCalledWith({
      query: 'luv',
    });
  });

  it('returns 400 when query is missing', async () => {
    const appError = Libs.Err.validation(Libs.ValidationErrorCode.MISSING_FIELD, 'Search query is required.', {
      service: Libs.ErrorService.NextJsServer,
      operation: 'validateMusicLibraryTrackAutocomplete',
      context: { field: 'query', statusCode: Libs.HttpStatusCode.BAD_REQUEST },
    });
    vi.spyOn(Core.MusicLibraryTrackAutocompleteController, 'fetch').mockRejectedValue(appError);

    const response = await GET(createRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Search query is required.');
  });

  it('returns 500 for unexpected errors', async () => {
    vi.spyOn(Core.MusicLibraryTrackAutocompleteController, 'fetch').mockRejectedValue(new Error('Unexpected failure'));

    const response = await GET(createRequest({ query: 'fea' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch music suggestions');
  });
});
