import * as Core from '@/core';
import { DatabaseErrorCode, Err, ErrorService } from '@/libs';

const MUSIC_LIBRARY_CACHE_KEY = 'music-library-cache';
const MUSIC_LIBRARY_DRAFT_KEY = 'music-library-draft';

/**
 * Browser cache wrapper for the Music Library hackathon domain.
 *
 * This lives under services/local for consistency with core IO boundaries, but it
 * intentionally uses browser localStorage instead of Dexie. The homeserver remains
 * the source of truth; this cache only speeds up client reads and draft recovery.
 */
export class LocalMusicLibraryCacheService {
  private constructor() {}

  static read(pubky: Core.Pubky): Core.MusicLibraryDocument | null {
    const storage = this.getStorage();
    if (!storage) {
      return null;
    }

    try {
      const rawValue = storage.getItem(this.getScopedKey(MUSIC_LIBRARY_CACHE_KEY, pubky));
      if (!rawValue) {
        return null;
      }

      return Core.MusicLibraryNormalizer.fromDocument(JSON.parse(rawValue) as Core.MusicLibraryDocumentInput);
    } catch (error) {
      throw Err.database(DatabaseErrorCode.QUERY_FAILED, 'Failed to read music library cache.', {
        service: ErrorService.Local,
        operation: 'readMusicLibraryCache',
        context: { pubky },
        cause: error,
      });
    }
  }

  static write({ pubky, document }: { pubky: Core.Pubky; document: Core.MusicLibraryDocument }): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.setItem(
        this.getScopedKey(MUSIC_LIBRARY_CACHE_KEY, pubky),
        JSON.stringify(Core.MusicLibraryNormalizer.fromDocument(document)),
      );
    } catch (error) {
      throw Err.database(DatabaseErrorCode.WRITE_FAILED, 'Failed to write music library cache.', {
        service: ErrorService.Local,
        operation: 'writeMusicLibraryCache',
        context: { pubky },
        cause: error,
      });
    }
  }

  static clear(pubky: Core.Pubky): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.removeItem(this.getScopedKey(MUSIC_LIBRARY_CACHE_KEY, pubky));
    } catch (error) {
      throw Err.database(DatabaseErrorCode.DELETE_FAILED, 'Failed to clear music library cache.', {
        service: ErrorService.Local,
        operation: 'clearMusicLibraryCache',
        context: { pubky },
        cause: error,
      });
    }
  }

  static readDraft(pubky: Core.Pubky): Core.MusicLibraryDraft | null {
    const storage = this.getStorage();
    if (!storage) {
      return null;
    }

    try {
      const rawValue = storage.getItem(this.getScopedKey(MUSIC_LIBRARY_DRAFT_KEY, pubky));
      if (!rawValue) {
        return null;
      }

      return Core.MusicLibraryNormalizer.sanitizeDraft(JSON.parse(rawValue) as Partial<Core.MusicLibraryDraft>);
    } catch (error) {
      throw Err.database(DatabaseErrorCode.QUERY_FAILED, 'Failed to read music library draft.', {
        service: ErrorService.Local,
        operation: 'readMusicLibraryDraft',
        context: { pubky },
        cause: error,
      });
    }
  }

  static writeDraft({ pubky, draft }: { pubky: Core.Pubky; draft: Core.MusicLibraryDraft }): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.setItem(
        this.getScopedKey(MUSIC_LIBRARY_DRAFT_KEY, pubky),
        JSON.stringify(Core.MusicLibraryNormalizer.sanitizeDraft(draft)),
      );
    } catch (error) {
      throw Err.database(DatabaseErrorCode.WRITE_FAILED, 'Failed to save music library draft.', {
        service: ErrorService.Local,
        operation: 'writeMusicLibraryDraft',
        context: { pubky },
        cause: error,
      });
    }
  }

  static clearDraft(pubky: Core.Pubky): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.removeItem(this.getScopedKey(MUSIC_LIBRARY_DRAFT_KEY, pubky));
    } catch (error) {
      throw Err.database(DatabaseErrorCode.DELETE_FAILED, 'Failed to clear music library draft.', {
        service: ErrorService.Local,
        operation: 'clearMusicLibraryDraft',
        context: { pubky },
        cause: error,
      });
    }
  }

  private static getScopedKey(baseKey: string, pubky: Core.Pubky): string {
    return `${baseKey}:${pubky}`;
  }

  private static getStorage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage;
  }
}
