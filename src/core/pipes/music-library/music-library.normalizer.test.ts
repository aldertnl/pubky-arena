import { describe, expect, it } from 'vitest';
import { MusicLibraryNormalizer } from './music-library.normalizer';

describe('MusicLibraryNormalizer', () => {
  const pubky = 'o1gg96ewuojmopcjbz8895478wdtxtzzuxnfjjz8o8e77csa1ngo';

  it('sanitizes drafts and builds items', () => {
    const draft = MusicLibraryNormalizer.sanitizeDraft({
      artist: 'Nujabes',
      track: 'Feather',
      year: '20ab05',
      genre: 'Hip-hop',
      rating: '42',
    });

    const item = MusicLibraryNormalizer.itemFromDraft(draft);

    expect(draft).toMatchObject({
      year: '2005',
      rating: '4',
    });
    expect(item).toMatchObject({
      artist: 'Nujabes',
      track: 'Feather',
      year: 2005,
      genre: 'Hip-hop',
      rating: 4,
    });
  });

  it('normalizes remote document payloads', () => {
    const document = MusicLibraryNormalizer.fromDocument({
      version: 3,
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
        {
          id: 'broken-item',
          album: 'Missing artist and track',
        },
      ],
    });

    expect(document.version).toBe(3);
    expect(document.items).toHaveLength(1);
    expect(document.items[0]?.track).toBe('Archangel');
  });

  it('builds buyer taste records from the saved library', () => {
    const tasteRecord = MusicLibraryNormalizer.toBuyerTasteRecord({
      pubky,
      document: {
        version: 1,
        updatedAt: 100,
        items: [
          {
            id: 'item-1',
            artist: 'Nujabes',
            album: 'Modal Soul',
            track: 'Feather',
            year: 2005,
            genre: 'Hip-hop',
            rating: 5,
            createdAt: 1,
            updatedAt: 2,
          },
          {
            id: 'item-2',
            artist: 'Nujabes',
            album: 'Metaphorical Music',
            track: 'Lady Brown',
            year: 2003,
            genre: 'Hip-hop',
            rating: 4,
            createdAt: 3,
            updatedAt: 4,
          },
        ],
      },
      consentGrantedAt: 123,
    });

    expect(tasteRecord.pubky).toBe(pubky);
    expect(tasteRecord.topGenres).toEqual(['Hip-hop']);
    expect(tasteRecord.topArtists).toEqual(['Nujabes']);
    expect(tasteRecord.favoriteTracks[0]).toEqual({
      artist: 'Nujabes',
      track: 'Feather',
    });
    expect(tasteRecord.consentGrantedAt).toBe(123);
  });

  it('builds profile summaries with representative albums for top artists', () => {
    const summary = MusicLibraryNormalizer.toProfileSummary({
      version: 1,
      updatedAt: 100,
      items: [
        {
          id: 'item-1',
          artist: 'Nujabes',
          album: 'Modal Soul',
          track: 'Feather',
          year: 2005,
          genre: 'Hip-hop',
          rating: 5,
          createdAt: 1,
          updatedAt: 20,
        },
        {
          id: 'item-2',
          artist: 'Nujabes',
          album: 'Metaphorical Music',
          track: 'Lady Brown',
          year: 2003,
          genre: 'Hip-hop',
          rating: 4,
          createdAt: 2,
          updatedAt: 10,
        },
        {
          id: 'item-3',
          artist: 'Burial',
          album: 'Untrue',
          track: 'Archangel',
          year: 2007,
          genre: 'Electronic',
          rating: 5,
          createdAt: 3,
          updatedAt: 30,
        },
      ],
    });

    expect(summary).toEqual({
      topArtists: [
        {
          artist: 'Nujabes',
          album: 'Modal Soul',
          track: 'Feather',
        },
        {
          artist: 'Burial',
          album: 'Untrue',
          track: 'Archangel',
        },
      ],
      totalItems: 3,
      updatedAt: 100,
    });
  });
});
