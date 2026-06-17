'use client';

import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { NEXUS_POSTS_PER_PAGE } from '@/config/nexus';
import { BookmarkController } from '@/controllers/bookmark/bookmark';
import { PostController } from '@/controllers/post/post';
import { StreamPostsController } from '@/controllers/stream/posts/posts';
import { Logger } from '@/libs/logger/logger';
import { isPostDeleted } from '@/libs/utils/utils';
import { PostStreamTypes } from '@/models/stream/post/postStream.types';
import { useAuthStore } from '@/stores/auth/auth.store';

const COLLECTION_KIND = 'collection';
const SEED_STREAM_ID = PostStreamTypes.TIMELINE_BOOKMARKS_ALL;
const EMPTY_IDS: string[] = [];

interface SeedCursor {
  lastPostId: string | undefined;
  streamTail: number;
}

const EMPTY_CURSOR: SeedCursor = { lastPostId: undefined, streamTail: 0 };

export interface UseBookmarksFeedResult {
  postIds: string[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  /** Optimistically surface a just-added bookmark (CTA add-by-url). */
  prependItems: (postIds: string | string[]) => void;
  /** Context parity with the timeline feed; bookmarks are curator-ordered so this aliases `prependItems`. */
  prependPosts: (postIds: string | string[]) => Promise<void>;
  /** Explicit removal used by the save picker to drop a card once its menu closes. */
  removePosts: (postIds: string | string[]) => void;
}

/**
 * useBookmarksFeed
 *
 * Saved-posts feed backed by the local `bookmarks` table as the single source
 * of truth, mirroring the `FollowedCollections` two-track architecture:
 *
 *   1. Render track — `useLiveQuery` joining the `bookmarks` table with
 *      `post_details`, keeping non-collection, non-deleted posts newest-first
 *      (collections live in their own Followed Collections section). Any
 *      bookmark add/remove anywhere in the app (save picker, CTA, toggle)
 *      reactively updates this list because every path writes the same table.
 *
 *   2. Seed track — paginated Nexus fetch on `timeline:bookmarks:all`, used
 *      only for its persist side effect (`persistPosts` hydrates `post_details`
 *      + the `bookmarks` table), broadening the live query's result set.
 *
 * The rendered list (`displayedIds`) merges live-query additions immediately
 * but only drops ids through the explicit `removePosts` path. That keeps a card
 * mounted while its save picker is open (so toggling the bookmark off does not
 * yank the menu's anchor out from under the user); the picker calls
 * `removePosts` once it closes. External changes fully reconcile on remount.
 */
export function useBookmarksFeed(): UseBookmarksFeedResult {
  // Gate the seed on auth hydration: the bookmarks Nexus endpoint resolves the
  // observer from `viewer_id`, read synchronously from the auth store. Firing
  // pre-hydration returns empty and latches `reachedEnd`, starving the seed.
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [pagesShown, setPagesShown] = useState(1);
  const cursorRef = useRef<SeedCursor>(EMPTY_CURSOR);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [seedLoading, setSeedLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialFetchRef = useRef(false);

  const [displayedIds, setDisplayedIds] = useState<string[]>([]);
  // Ids dropped via `removePosts`; suppressed from the merge until they reappear
  // in the live query (i.e. the post is bookmarked again).
  const removedIdsRef = useRef<Set<string>>(new Set());

  const visibleLimit = pagesShown * NEXUS_POSTS_PER_PAGE;

  // Live query: bookmarks table ∩ non-collection post details, newest first,
  // sliced to the current window. Reads go through controllers so all data
  // access stays inside the layered architecture, while Dexie still observes
  // the underlying table reads. Returns `undefined` until the first resolve.
  const liveIds = useLiveQuery(async () => {
    try {
      const ids = await BookmarkController.getAll();
      if (ids.length === 0) return EMPTY_IDS;
      const details = await PostController.getDetailsByIds({ compositeIds: ids });
      const result: string[] = [];
      for (let i = 0; i < ids.length; i += 1) {
        const detail = details[i];
        if (detail && detail.kind !== COLLECTION_KIND && !isPostDeleted(detail.content)) {
          result.push(ids[i]);
          if (result.length >= visibleLimit) break;
        }
      }
      return result;
    } catch (err) {
      Logger.error('[useBookmarksFeed] Live query failed', { error: err });
      return EMPTY_IDS;
    }
  }, [visibleLimit]);

  // Merge live-query results into the rendered list: additions appear in
  // live-query order; removals are deferred to `removePosts` so an open picker
  // keeps its card. Re-bookmarked ids clear their suppressed flag here.
  useEffect(() => {
    if (liveIds === undefined) return;
    const removed = removedIdsRef.current;
    for (const id of liveIds) removed.delete(id);

    setDisplayedIds((prev) => {
      const live = liveIds.filter((id) => !removed.has(id));
      const liveSet = new Set(liveIds);
      // Previously-shown ids no longer in the live set and not explicitly
      // removed (e.g. unbookmarked while the picker is still open): keep them in
      // place until the picker closes and calls `removePosts`.
      const deferred = prev.filter((id) => !liveSet.has(id) && !removed.has(id));
      if (deferred.length === 0) return live;

      const prevIndex = new Map(prev.map((id, index) => [id, index]));
      const merged = [...live];
      for (const id of deferred) {
        const insertAt = Math.min(prevIndex.get(id) ?? merged.length, merged.length);
        merged.splice(insertAt, 0, id);
      }
      return merged;
    });
  }, [liveIds]);

  const fetchNextSeedSlice = async ({ isInitial }: { isInitial: boolean }) => {
    try {
      if (isInitial) {
        await StreamPostsController.prepareStreamForInitialLoad({ streamId: SEED_STREAM_ID });
        const cachedTail = await StreamPostsController.getCachedLastPostTimestamp({ streamId: SEED_STREAM_ID });
        cursorRef.current = { lastPostId: undefined, streamTail: cachedTail };
      }

      const result = await StreamPostsController.getOrFetchStreamSlice({
        streamId: SEED_STREAM_ID,
        lastPostId: cursorRef.current.lastPostId,
        streamTail: cursorRef.current.streamTail,
        limit: NEXUS_POSTS_PER_PAGE,
      });

      const nextLastId = result.nextPageIds[result.nextPageIds.length - 1];
      cursorRef.current = {
        lastPostId: nextLastId ?? cursorRef.current.lastPostId,
        streamTail: result.timestamp ?? cursorRef.current.streamTail,
      };
      setReachedEnd(result.reachedEnd === true);
      setError(null);
    } catch (err) {
      Logger.error('[useBookmarksFeed] Failed to seed bookmark slice', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks.');
      setReachedEnd(true);
    }
  };

  // Initial seed — once per mount, after auth hydrates.
  useEffect(() => {
    if (!hasHydrated) return;
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;
    setSeedLoading(true);
    void fetchNextSeedSlice({ isInitial: true }).finally(() => setSeedLoading(false));
    // `fetchNextSeedSlice` is recreated each render; `hasHydrated` is the only
    // intended trigger for this once-per-mount seed.
  }, [hasHydrated]);

  // More to show while Nexus has further pages, or while the window is full and
  // the local table may hold additional rows beyond it.
  const hasMore = !reachedEnd || (liveIds?.length ?? 0) >= visibleLimit;

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setPagesShown((page) => page + 1);
    // Window grew to reveal more local rows; only hit Nexus if it has more pages.
    if (reachedEnd) return;
    setLoadingMore(true);
    await fetchNextSeedSlice({ isInitial: false }).finally(() => setLoadingMore(false));
  };

  const prependItems = (postIds: string | string[]) => {
    const ids = Array.isArray(postIds) ? postIds : [postIds];
    if (ids.length === 0) return;
    for (const id of ids) removedIdsRef.current.delete(id);
    setDisplayedIds((prev) => {
      const existing = new Set(prev);
      const toAdd = ids.filter((id) => !existing.has(id));
      return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
    });
  };

  const prependPosts = async (postIds: string | string[]) => {
    prependItems(postIds);
  };

  const removePosts = (postIds: string | string[]) => {
    const ids = Array.isArray(postIds) ? postIds : [postIds];
    if (ids.length === 0) return;
    for (const id of ids) removedIdsRef.current.add(id);
    const removed = removedIdsRef.current;
    setDisplayedIds((prev) => prev.filter((id) => !removed.has(id)));
  };

  const loading = (seedLoading || liveIds === undefined) && displayedIds.length === 0;

  return {
    postIds: displayedIds,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    prependItems,
    prependPosts,
    removePosts,
  };
}
