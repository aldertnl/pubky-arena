import { beforeEach, describe, expect, it } from 'vitest';
import { LocalMusicLibraryCacheService } from './music-library-cache';

describe('LocalMusicLibraryCacheService', () => {
  const pubky = 'o1gg96ewuojmopcjbz8895478wdtxtzzuxnfjjz8o8e77csa1ngo';

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('writes and reads cached music library documents', () => {
    LocalMusicLibraryCacheService.write({
      pubky,
      document: {
        version: 1,
        updatedAt: 100,
        items: [
          {
            id: 'item-1',
            artist: 'Burial',
            album: 'Untrue',
            track: 'Archangel',
            year: 2007,
            genre: 'UK Garage',
            rating: 5,
            createdAt: 10,
            updatedAt: 11,
          },
        ],
      },
    });

    expect(LocalMusicLibraryCacheService.read(pubky)).toMatchObject({
      items: [
        {
          track: 'Archangel',
          rating: 5,
        },
      ],
    });
  });

  it('writes, reads, and clears drafts', () => {
    LocalMusicLibraryCacheService.writeDraft({
      pubky,
      draft: {
        recordingId: 'track-1',
        artist: 'DJ Shadow',
        album: '',
        track: 'Midnight in a Perfect World',
        year: '19ab98',
        genre: 'Trip-hop',
        rating: '52',
      },
    });

    expect(LocalMusicLibraryCacheService.readDraft(pubky)).toEqual({
      recordingId: 'track-1',
      artist: 'DJ Shadow',
      album: '',
      track: 'Midnight in a Perfect World',
      year: '1998',
      genre: 'Trip-hop',
      rating: '5',
    });

    LocalMusicLibraryCacheService.clearDraft(pubky);
    expect(LocalMusicLibraryCacheService.readDraft(pubky)).toBeNull();
  });
});
