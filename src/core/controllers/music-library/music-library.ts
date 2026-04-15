import * as Core from '@/core';
import { AuthErrorCode, DatabaseErrorCode, Err, ErrorService } from '@/libs';

export class MusicLibraryController {
  private constructor() {}

  static async getOrFetchMusicLibrary(): Promise<Core.MusicLibraryDocument | null> {
    return await Core.MusicLibraryApplication.getOrFetchMusicLibrary(this.getCurrentUserPubky());
  }

  static async getOrFetchMusicLibraryByPubky(pubky: Core.Pubky): Promise<Core.MusicLibraryDocument | null> {
    return await Core.MusicLibraryApplication.getOrFetchMusicLibrary(pubky);
  }

  static async fetchMusicLibrary(): Promise<Core.MusicLibraryDocument | null> {
    return await Core.MusicLibraryApplication.fetchFromHomeserver(this.getCurrentUserPubky());
  }

  static getMusicLibraryDraft(): Core.MusicLibraryDraft | null {
    return Core.MusicLibraryApplication.getMusicLibraryDraft(this.getCurrentUserPubky());
  }

  static saveMusicLibraryDraft(draft: Core.MusicLibraryDraft): Core.MusicLibraryDraft {
    const pubky = this.getCurrentUserPubky();
    const persistedDraft = Core.MusicLibraryApplication.saveDraft({
      pubky,
      draft,
    });

    this.logAction('save draft', {
      pubky,
      draft: persistedDraft,
    });

    return persistedDraft;
  }

  static clearMusicLibraryDraft(): void {
    const pubky = this.getCurrentUserPubky();
    Core.MusicLibraryApplication.clearDraft(pubky);

    this.logAction('clear draft', {
      pubky,
    });
  }

  static async commitCreateMusicItem(draft: Core.MusicLibraryDraft): Promise<Core.MusicLibraryDocument> {
    const pubky = this.getCurrentUserPubky();
    const currentDocument =
      (await Core.MusicLibraryApplication.getOrFetchMusicLibrary(pubky)) ??
      Core.MusicLibraryNormalizer.createEmptyDocument();
    const item = Core.MusicLibraryNormalizer.itemFromDraft(draft);

    const nextDocument: Core.MusicLibraryDocument = {
      ...currentDocument,
      updatedAt: Date.now(),
      items: [item, ...currentDocument.items],
    };

    const persistedDocument = await Core.MusicLibraryApplication.commitUpdateMusicLibrary({
      pubky,
      document: nextDocument,
    });

    Core.MusicLibraryApplication.clearDraft(pubky);

    this.logAction('add item', {
      pubky,
      itemId: item.id,
      artist: item.artist,
      track: item.track,
      totalItems: persistedDocument.items.length,
    });

    return persistedDocument;
  }

  static async commitDeleteMusicItem({ id }: { id: string }): Promise<Core.MusicLibraryDocument> {
    const pubky = this.getCurrentUserPubky();
    const currentDocument =
      (await Core.MusicLibraryApplication.getOrFetchMusicLibrary(pubky)) ??
      Core.MusicLibraryNormalizer.createEmptyDocument();

    const nextItems = currentDocument.items.filter((item) => item.id !== id);

    if (nextItems.length === currentDocument.items.length) {
      throw Err.database(DatabaseErrorCode.RECORD_NOT_FOUND, 'Music library item not found.', {
        service: ErrorService.Local,
        operation: 'commitDeleteMusicItem',
        context: { id, pubky },
      });
    }

    const persistedDocument = await Core.MusicLibraryApplication.commitUpdateMusicLibrary({
      pubky,
      document: {
        ...currentDocument,
        updatedAt: Date.now(),
        items: nextItems,
      },
    });

    this.logAction('delete item', {
      pubky,
      itemId: id,
      totalItems: persistedDocument.items.length,
    });

    return persistedDocument;
  }

  static async commitUpdateMusicItem({
    id,
    draft,
  }: {
    id: string;
    draft: Core.MusicLibraryDraft;
  }): Promise<Core.MusicLibraryDocument> {
    const pubky = this.getCurrentUserPubky();
    const currentDocument =
      (await Core.MusicLibraryApplication.getOrFetchMusicLibrary(pubky)) ??
      Core.MusicLibraryNormalizer.createEmptyDocument();
    const currentItem = currentDocument.items.find((item) => item.id === id);

    if (!currentItem) {
      throw Err.database(DatabaseErrorCode.RECORD_NOT_FOUND, 'Music library item not found.', {
        service: ErrorService.Local,
        operation: 'commitUpdateMusicItem',
        context: { id, pubky },
      });
    }

    const updatedItem = Core.MusicLibraryNormalizer.itemFromDraft(draft, {
      id: currentItem.id,
      createdAt: currentItem.createdAt,
    });

    const persistedDocument = await Core.MusicLibraryApplication.commitUpdateMusicLibrary({
      pubky,
      document: {
        ...currentDocument,
        updatedAt: Date.now(),
        items: currentDocument.items.map((item) => (item.id === id ? updatedItem : item)),
      },
    });

    this.logAction('update item', {
      pubky,
      itemId: id,
      artist: updatedItem.artist,
      track: updatedItem.track,
      totalItems: persistedDocument.items.length,
    });

    return persistedDocument;
  }

  private static getCurrentUserPubky(): Core.Pubky {
    const currentUserPubky = Core.useAuthStore.getState().selectCurrentUserPubky();

    if (!currentUserPubky) {
      throw Err.auth(AuthErrorCode.UNAUTHORIZED, 'Music library actions require an authenticated user.', {
        service: ErrorService.Local,
        operation: 'getCurrentUserPubky',
      });
    }

    return currentUserPubky;
  }

  private static logAction(action: string, payload: Record<string, unknown>): void {
    console.info(`[MusicLibrary] ${action}`, payload);
  }
}
