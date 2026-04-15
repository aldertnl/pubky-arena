import * as Specs from 'pubky-app-specs';
import * as Core from '@/core';
import { Err, ErrorService, ValidationErrorCode } from '@/libs';

export interface MusicLibraryItem {
  id: string;
  artist: string;
  album: string;
  track: string;
  year: number | null;
  genre: string;
  rating: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface MusicLibraryDocument {
  version: number;
  updatedAt: number;
  items: MusicLibraryItem[];
}

export interface MusicLibraryDraft {
  recordingId: string;
  artist: string;
  album: string;
  track: string;
  year: string;
  genre: string;
  rating: string;
}

export interface BuyerTasteRecord {
  pubky: Core.Pubky;
  topGenres: string[];
  topArtists: string[];
  favoriteTracks: Array<{
    artist: string;
    track: string;
  }>;
  consentGrantedAt: number | null;
}

export interface MusicLibraryProfileSummary {
  topArtists: Array<{
    artist: string;
    album: string | null;
    track: string;
  }>;
  totalItems: number;
  updatedAt: number | null;
}

export interface MusicLibraryDocumentInput {
  version?: number;
  updatedAt?: number;
  items?: Array<Partial<MusicLibraryItem>>;
}

export interface MusicLibraryNormalizerResult {
  document: MusicLibraryDocument;
  meta: {
    url: string;
    path: string;
  };
}

const MUSIC_LIBRARY_PATH = 'pub/pubky.app/music-library.json';
const MUSIC_LIBRARY_VERSION = 1;

export class MusicLibraryNormalizer {
  private constructor() {}

  static buildUrl(pubky: Core.Pubky): string {
    const baseUri = Specs.baseUriBuilder(pubky);
    return `${baseUri}music-library.json`;
  }

  static createEmptyDocument(): MusicLibraryDocument {
    return {
      version: MUSIC_LIBRARY_VERSION,
      updatedAt: Date.now(),
      items: [],
    };
  }

  static createEmptyDraft(): MusicLibraryDraft {
    return {
      recordingId: '',
      artist: '',
      album: '',
      track: '',
      year: '',
      genre: '',
      rating: '5',
    };
  }

  static sanitizeDraft(draft: Partial<MusicLibraryDraft> | null | undefined): MusicLibraryDraft {
    const emptyDraft = this.createEmptyDraft();

    if (!draft) {
      return emptyDraft;
    }

    return {
      recordingId: typeof draft.recordingId === 'string' ? draft.recordingId : emptyDraft.recordingId,
      artist: typeof draft.artist === 'string' ? draft.artist : emptyDraft.artist,
      album: typeof draft.album === 'string' ? draft.album : emptyDraft.album,
      track: typeof draft.track === 'string' ? draft.track : emptyDraft.track,
      year: typeof draft.year === 'string' ? draft.year.replace(/\D/g, '').slice(0, 4) : emptyDraft.year,
      genre: typeof draft.genre === 'string' ? draft.genre : emptyDraft.genre,
      rating:
        typeof draft.rating === 'string'
          ? draft.rating.replace(/\D/g, '').slice(0, 1) || emptyDraft.rating
          : emptyDraft.rating,
    };
  }

  static itemFromDraft(
    draft: MusicLibraryDraft,
    existing?: Pick<MusicLibraryItem, 'id' | 'createdAt'>,
  ): MusicLibraryItem {
    const sanitizedDraft = this.sanitizeDraft(draft);
    const artist = sanitizedDraft.artist.trim();
    const track = sanitizedDraft.track.trim();

    if (!artist || !track) {
      throw Err.validation(ValidationErrorCode.INVALID_INPUT, 'Artist and track are required.', {
        service: ErrorService.Local,
        operation: 'itemFromDraft',
        context: { draft: sanitizedDraft },
      });
    }

    const year = sanitizedDraft.year ? Number.parseInt(sanitizedDraft.year, 10) : null;
    const rating = sanitizedDraft.rating ? Number.parseInt(sanitizedDraft.rating, 10) : null;

    if (year !== null && Number.isNaN(year)) {
      throw Err.validation(ValidationErrorCode.INVALID_INPUT, 'Year must be a valid number.', {
        service: ErrorService.Local,
        operation: 'itemFromDraft',
        context: { draft: sanitizedDraft },
      });
    }

    if (rating !== null && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
      throw Err.validation(ValidationErrorCode.INVALID_INPUT, 'Rating must be between 1 and 5.', {
        service: ErrorService.Local,
        operation: 'itemFromDraft',
        context: { draft: sanitizedDraft },
      });
    }

    const now = Date.now();

    return {
      id: existing?.id ?? `music-library-item-${now}`,
      artist,
      album: sanitizedDraft.album.trim(),
      track,
      year,
      genre: sanitizedDraft.genre.trim(),
      rating,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
  }

  static fromDocument(json: MusicLibraryDocumentInput | null | undefined): MusicLibraryDocument {
    if (!json) {
      return this.createEmptyDocument();
    }

    return {
      version: typeof json.version === 'number' ? json.version : MUSIC_LIBRARY_VERSION,
      updatedAt: typeof json.updatedAt === 'number' ? json.updatedAt : Date.now(),
      items: Array.isArray(json.items)
        ? json.items
            .map((item, index) => this.normalizeItem(item, index))
            .filter((item): item is MusicLibraryItem => item !== null)
        : [],
    };
  }

  static to(document: MusicLibraryDocument, pubky: Core.Pubky): MusicLibraryNormalizerResult {
    const normalizedDocument = this.fromDocument(document);

    return {
      document: normalizedDocument,
      meta: {
        url: this.buildUrl(pubky),
        path: MUSIC_LIBRARY_PATH,
      },
    };
  }

  static toBuyerTasteRecord({
    pubky,
    document,
    consentGrantedAt = null,
  }: {
    pubky: Core.Pubky;
    document: MusicLibraryDocument;
    consentGrantedAt?: number | null;
  }): BuyerTasteRecord {
    const normalizedDocument = this.fromDocument(document);

    return {
      pubky,
      topGenres: this.getTopValues(
        normalizedDocument.items.map((item) => item.genre),
        3,
      ),
      topArtists: this.getTopValues(
        normalizedDocument.items.map((item) => item.artist),
        3,
      ),
      favoriteTracks: normalizedDocument.items
        .slice()
        .sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0))
        .slice(0, 5)
        .map((item) => ({
          artist: item.artist,
          track: item.track,
        })),
      consentGrantedAt,
    };
  }

  static toProfileSummary(document: MusicLibraryDocument | null | undefined): MusicLibraryProfileSummary | null {
    if (!document || document.items.length === 0) {
      return null;
    }

    const normalizedDocument = this.fromDocument(document);

    return {
      topArtists: this.getTopArtistSummaries(normalizedDocument.items, 5),
      totalItems: normalizedDocument.items.length,
      updatedAt: normalizedDocument.updatedAt ?? null,
    };
  }

  private static normalizeItem(item: Partial<MusicLibraryItem>, index: number): MusicLibraryItem | null {
    if (typeof item.artist !== 'string' || typeof item.track !== 'string') {
      return null;
    }

    const fallbackTimestamp = Date.now() + index;

    return {
      id: typeof item.id === 'string' && item.id ? item.id : `music-library-item-${fallbackTimestamp}`,
      artist: item.artist.trim(),
      album: typeof item.album === 'string' ? item.album.trim() : '',
      track: item.track.trim(),
      year: typeof item.year === 'number' ? item.year : null,
      genre: typeof item.genre === 'string' ? item.genre.trim() : '',
      rating: typeof item.rating === 'number' ? item.rating : null,
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : fallbackTimestamp,
      updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : fallbackTimestamp,
    };
  }

  private static getTopValues(values: string[], limit: number): string[] {
    const counts = new Map<string, number>();

    values
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value) => {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, limit)
      .map(([value]) => value);
  }

  private static getTopArtistSummaries(
    items: MusicLibraryItem[],
    limit: number,
  ): Array<{
    artist: string;
    album: string | null;
    track: string;
  }> {
    const artistEntries = new Map<
      string,
      {
        count: number;
        items: MusicLibraryItem[];
      }
    >();

    items.forEach((item) => {
      const artist = item.artist.trim();
      if (!artist) {
        return;
      }

      const existing = artistEntries.get(artist);
      if (existing) {
        existing.count += 1;
        existing.items.push(item);
        return;
      }

      artistEntries.set(artist, {
        count: 1,
        items: [item],
      });
    });

    return [...artistEntries.entries()]
      .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))
      .slice(0, limit)
      .map(([artist, entry]) => {
        const representativeItem = this.getRepresentativeItem(entry.items);

        return {
          artist,
          album: representativeItem?.album || null,
          track: representativeItem?.track ?? entry.items[0]?.track ?? '',
        };
      });
  }

  private static getRepresentativeItem(items: MusicLibraryItem[]): MusicLibraryItem | null {
    const candidateWithAlbum = items
      .filter((item) => item.album)
      .sort(
        (left, right) =>
          (right.rating ?? 0) - (left.rating ?? 0) ||
          right.updatedAt - left.updatedAt ||
          left.album.localeCompare(right.album),
      )[0];

    if (candidateWithAlbum) {
      return candidateWithAlbum;
    }

    return (
      items
        .slice()
        .sort(
          (left, right) =>
            (right.rating ?? 0) - (left.rating ?? 0) ||
            right.updatedAt - left.updatedAt ||
            left.track.localeCompare(right.track),
        )[0] ?? null
    );
  }
}
