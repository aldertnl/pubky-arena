import type { TBookmarkEventParams } from '@/controllers/bookmark/bookmark.types';
import { db } from '@/database/franky/franky';
import { DatabaseErrorCode } from '@/libs/error/error.codes';
import { Err } from '@/libs/error/error.factories';
import { ErrorService } from '@/libs/error/error.types';
import { HttpMethod } from '@/libs/http/http.types';
import { Logger } from '@/libs/logger/logger';
import { BookmarkModel } from '@/models/bookmark/bookmark';
import { UserCountsModel } from '@/models/user/counts/userCounts';

export class LocalBookmarkService {
  private static readonly BOOKMARK_TABLES = [BookmarkModel.table, UserCountsModel.table] as const;

  /**
   * Persists a bookmark operation (create or delete).
   *
   * The `bookmarks` table is the single local source of truth for the saved-posts
   * feed (rendered via `useBookmarksFeed`'s live query), so this only upserts /
   * deletes the bookmark record and adjusts the user's bookmark count. No stream
   * cache is touched — the live query reacts to the table write directly.
   */
  static async persist(action: HttpMethod, { userId, postId }: TBookmarkEventParams) {
    const isCreate = action === HttpMethod.PUT;

    try {
      await db.transaction('rw', this.BOOKMARK_TABLES, async () => {
        const existingBookmark = await BookmarkModel.findById(postId);
        const bookmarkExists = !!existingBookmark;

        // Skip if already in desired state (idempotent operation)
        if (bookmarkExists === isCreate) {
          Logger.debug(isCreate ? 'Post already bookmarked' : 'Post not bookmarked', { postId });
          return;
        }

        if (isCreate) {
          await Promise.all([
            BookmarkModel.upsert({
              id: postId,
              created_at: Date.now(),
            }),
            UserCountsModel.updateCounts({ userId, countChanges: { bookmarks: 1 } }),
          ]);

          Logger.debug('Bookmark created', { postId });
        } else {
          await Promise.all([
            BookmarkModel.deleteById(postId),
            UserCountsModel.updateCounts({ userId, countChanges: { bookmarks: -1 } }),
          ]);

          Logger.debug('Bookmark deleted', { postId });
        }
      });
    } catch (error) {
      throw Err.database(DatabaseErrorCode.WRITE_FAILED, `Failed to ${isCreate ? 'create' : 'delete'} bookmark`, {
        service: ErrorService.Local,
        operation: isCreate ? 'createBookmark' : 'deleteBookmark',
        context: { postId },
        cause: error,
      });
    }
  }

  /**
   * Checks if a post is bookmarked.
   *
   * @param postId - Composite post ID (authorId:postId)
   * @returns boolean indicating if the post is bookmarked
   */
  static async exists(postId: string): Promise<boolean> {
    const bookmark = await BookmarkModel.findById(postId);
    return bookmark !== null;
  }

  /**
   * Get all bookmarked post IDs (unordered).
   *
   * @returns Array of bookmarked post IDs
   */
  static async getAllBookmarks(): Promise<string[]> {
    return await BookmarkModel.findAll();
  }

  /**
   * Get all bookmarked post IDs sorted by `created_at` descending
   * (most recently bookmarked first).
   *
   * @returns Array of bookmarked post IDs, newest first.
   */
  static async getAllBookmarksSorted(): Promise<string[]> {
    const sorted = await BookmarkModel.findAllSorted();
    return sorted.map((b) => b.id);
  }
}
