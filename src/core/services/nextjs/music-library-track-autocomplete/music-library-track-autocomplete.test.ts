import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();

describe('NextJsMusicLibraryTrackAutocompleteService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('maps MusicBrainz recording results to track suggestions', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          recordings: [
            {
              id: 'track-1',
              title: 'Feather',
              score: '100',
              'first-release-date': '2005-11-11',
              releases: [{ title: 'Modal Soul', date: '2005-11-11' }],
              'artist-credit': [{ name: 'Nujabes', joinphrase: ' feat. ' }, { name: 'Cise Starr' }],
            },
            {
              id: 'track-2',
              title: 'Luv(sic.) pt3',
              score: '90',
              releases: [{ date: '2003-01-01' }],
              'artist-credit': [{ artist: { name: 'Nujabes' }, joinphrase: ' feat. ' }, { name: 'Shing02' }],
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const { NextJsMusicLibraryTrackAutocompleteService } = await import('./music-library-track-autocomplete');
    const result = await NextJsMusicLibraryTrackAutocompleteService.fetch({ query: 'fea', limit: 5 });

    expect(result).toEqual({
      suggestions: [
        {
          id: 'track-1',
          track: 'Feather',
          artist: 'Nujabes feat. Cise Starr',
          album: 'Modal Soul',
          year: '2005',
        },
        {
          id: 'track-2',
          track: 'Luv(sic.) pt3',
          artist: 'Nujabes feat. Shing02',
          album: null,
          year: '2003',
        },
      ],
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(String(mockFetch.mock.calls[0]?.[0])).toContain(
      'query=%28recording%3A%22fea%22+OR+artist%3A%22fea%22+OR+release%3A%22fea%22%29',
    );
  });

  it('returns an empty suggestions array when MusicBrainz has no results', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ recordings: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const { NextJsMusicLibraryTrackAutocompleteService } = await import('./music-library-track-autocomplete');
    const result = await NextJsMusicLibraryTrackAutocompleteService.fetch({ query: 'zzz', limit: 5 });

    expect(result).toEqual({
      suggestions: [],
    });
  });
});
