import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();

describe('NextJsMusicLibraryAlbumCoverService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('falls back to later release groups when the first result has no cover art', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            'release-groups': [
              {
                id: 'bootleg-no-cover',
                title: 'Inspirations, Part I',
                'primary-type': 'Album',
                'secondary-types': ['Compilation'],
                'artist-credit': [{ name: 'Muse', artist: { name: 'Muse' } }],
                releases: [{ status: 'Bootleg' }],
              },
              {
                id: 'official-with-cover',
                title: 'Absolution Tour',
                'primary-type': 'Album',
                'secondary-types': ['Live'],
                'artist-credit': [{ name: 'Muse', artist: { name: 'Muse' } }],
                releases: [{ status: 'Official' }],
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(new Response('not found', { status: 404, headers: { 'content-type': 'text/plain' } }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            images: [
              {
                front: true,
                thumbnails: {
                  large: 'http://coverartarchive.org/release/official-with-cover/front-500.jpg',
                },
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

    const { NextJsMusicLibraryAlbumCoverService } = await import('./music-library-cover');
    const result = await NextJsMusicLibraryAlbumCoverService.fetch({ artist: 'Muse' });

    expect(result).toEqual({
      imageUrl: 'https://coverartarchive.org/release/official-with-cover/front-500.jpg',
    });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
