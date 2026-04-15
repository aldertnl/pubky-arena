import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Core from '@/core';
import { HttpMethod, ErrorService, httpStatusCodeToError } from '@/libs';
import { MusicLibraryApplication } from './music-library';

describe('MusicLibraryApplication', () => {
  const pubky = 'o1gg96ewuojmopcjbz8895478wdtxtzzuxnfjjz8o8e77csa1ngo' as Core.Pubky;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached documents without calling the homeserver', async () => {
    vi.spyOn(Core.LocalMusicLibraryCacheService, 'read').mockReturnValue({
      version: 1,
      updatedAt: 100,
      items: [],
    });
    const requestSpy = vi.spyOn(Core.HomeserverService, 'request').mockResolvedValue(undefined);

    const result = await MusicLibraryApplication.getOrFetchMusicLibrary(pubky);

    expect(result).toEqual({
      version: 1,
      updatedAt: 100,
      items: [],
    });
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('fetches from homeserver and caches the result on cache miss', async () => {
    vi.spyOn(Core.LocalMusicLibraryCacheService, 'read').mockReturnValue(null);
    const writeSpy = vi.spyOn(Core.LocalMusicLibraryCacheService, 'write').mockImplementation(() => {});
    vi.spyOn(Core.HomeserverService, 'request').mockResolvedValue({
      version: 1,
      updatedAt: 100,
      items: [
        {
          id: 'item-1',
          artist: 'Burial',
          track: 'Archangel',
          rating: 5,
          createdAt: 10,
          updatedAt: 20,
        },
      ],
    });

    const result = await MusicLibraryApplication.getOrFetchMusicLibrary(pubky);

    expect(result?.items[0]?.track).toBe('Archangel');
    expect(writeSpy).toHaveBeenCalledWith({
      pubky,
      document: expect.objectContaining({
        items: [expect.objectContaining({ track: 'Archangel' })],
      }),
    });
  });

  it('returns null when the music library file is missing on homeserver', async () => {
    vi.spyOn(Core.HomeserverService, 'request').mockRejectedValue(
      httpStatusCodeToError(
        404,
        'Not found',
        ErrorService.Homeserver,
        'request',
        `pubky://${pubky}/pub/pubky.app/music-library.json`,
      ),
    );

    const result = await MusicLibraryApplication.fetchFromHomeserver(pubky);

    expect(result).toBeNull();
  });

  it('pushes document updates to the homeserver and updates cache', async () => {
    const requestSpy = vi.spyOn(Core.HomeserverService, 'request').mockResolvedValue(undefined);
    const writeSpy = vi.spyOn(Core.LocalMusicLibraryCacheService, 'write').mockImplementation(() => {});

    const document = await MusicLibraryApplication.commitUpdateMusicLibrary({
      pubky,
      document: {
        version: 1,
        updatedAt: 100,
        items: [],
      },
    });

    expect(requestSpy).toHaveBeenCalledWith({
      method: HttpMethod.PUT,
      url: `pubky://${pubky}/pub/pubky.app/music-library.json`,
      bodyJson: expect.any(Object),
    });
    expect(writeSpy).toHaveBeenCalledWith({
      pubky,
      document,
    });
  });
});
