'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { NEXUS_POSTS_PER_PAGE } from '@/config/nexus';
import { NOT_FOUND_CACHED_STREAM } from '@/controllers/stream/posts/post.constants';
import { StreamPostsController } from '@/controllers/stream/posts/posts';
import type { TReadPostStreamChunkResponse } from '@/controllers/stream/posts/posts.types';
import { isAppError } from '@/libs/error/error.utils';
import { Logger } from '@/libs/logger/logger';
import { isSkipPaginatedStream } from '@/models/stream/post/postStream.types';
import { sortPostIdsByTimestamp } from '@/utils/sorting';
import type { UseStreamPaginationOptions, UseStreamPaginationResult } from './useStreamPagination.types';

/**
 * useStreamPagination
 *
 * Shared hook for managing stream pagination state and logic.
 * Handles initial load, infinite scroll pagination, and state management.
 */
export function useStreamPagination({
  streamId,
  limit = NEXUS_POSTS_PER_PAGE,
  resetOnStreamChange = true,
  onError,
}: UseStreamPaginationOptions): UseStreamPaginationResult {
  const [postIds, setPostIds] = useState<string[]>([]);
  const [lastPostId, setLastPostId] = useState<string | undefined>(undefined);
  const [streamTail, setStreamTail] = useState<number>(NOT_FOUND_CACHED_STREAM);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const postIdsRef = useRef<string[]>([]);

  // Skip-paginated streams page by offset. Track that offset independently of the rendered
  // list length so optimistic mutations (prependItems/prependPosts) don't shift the cursor and
  // cause server-side items to be skipped on the next loadMore.
  const skipOffsetRef = useRef<number>(0);

  /**
   * Sets the appropriate loading state based on load type
   */
  const setLoadingState = useCallback((isInitialLoad: boolean, isLoading: boolean) => {
    if (isInitialLoad) {
      setLoading(isLoading);
    } else {
      setLoadingMore(isLoading);
    }
  }, []);

  /**
   * Fetches a slice from the stream
   */
  const fetchStreamSlice = useCallback(
    async (isInitialLoad: boolean) => {
      setLoadingState(isInitialLoad, true);
      setError(null);

      // Offset-paginated streams (engagement + single-collection items) carry the count of
      // already-loaded posts as their cursor; Nexus returns no timestamp/score cursor for them.
      const isSkipStream = isSkipPaginatedStream(streamId);

      try {
        let result: TReadPostStreamChunkResponse;

        if (isInitialLoad) {
          // Initial load always re-seeds skip-paginated streams from offset 0.
          skipOffsetRef.current = 0;

          // Prepare stream for initial load: clear stale cache, merge unread posts, clear unread stream
          await StreamPostsController.prepareStreamForInitialLoad({ streamId });

          const cachedLastPostTimestamp = await StreamPostsController.getCachedLastPostTimestamp({ streamId });
          setStreamTail(cachedLastPostTimestamp);

          result = await StreamPostsController.getOrFetchStreamSlice({
            streamId,
            lastPostId: undefined,
            // Skip-paginated streams start at offset 0; timestamp streams seed from the cached tail.
            streamTail: isSkipStream ? 0 : cachedLastPostTimestamp,
            limit,
          });
        } else {
          const cursorValue = isSkipStream ? skipOffsetRef.current : streamTail;

          result = await StreamPostsController.getOrFetchStreamSlice({
            streamId,
            lastPostId,
            streamTail: cursorValue,
            limit,
          });
        }

        // Handle empty results
        if (result.nextPageIds.length === 0) {
          // Update cursor even on empty results so subsequent loads can progress
          if (result.timestamp !== undefined) {
            setStreamTail(result.timestamp);
          }

          // Respect reachedEnd flag - only set hasMore to false if we actually
          // reached the end of stream, not just because filters removed all posts
          if (result.reachedEnd) {
            Logger.debug('[useStreamPagination] Empty result, reached end of stream');
            setHasMore(false);
          } else {
            Logger.debug('[useStreamPagination] Empty result after filtering, more posts may exist');
            setHasMore(true);
          }

          setLoadingState(isInitialLoad, false);
          return;
        }

        // Deduplicate posts
        const existingIds = new Set(postIdsRef.current);
        const newUniquePostIds = result.nextPageIds.filter((id) => !existingIds.has(id));

        // Update pagination cursors even if all posts are duplicates
        // (we need to move forward in the stream)
        const lastId = result.nextPageIds[result.nextPageIds.length - 1];
        setLastPostId(lastId);

        if (result.timestamp !== undefined) {
          setStreamTail(result.timestamp);
        }

        // Advance the skip cursor by the number of ids this page returned (already
        // server-side filtered and capped to `limit`), independently of the rendered
        // list, so the next offset stays correct even when client-side dedup drops some.
        if (isSkipStream) {
          skipOffsetRef.current += result.nextPageIds.length;
        }

        // Check hasMore based on reachedEnd flag from the response
        // This correctly handles cases where we hit MAX_FETCH_ITERATIONS due to mute filtering
        // vs actually reaching the end of the stream
        const hasMorePosts = result.reachedEnd !== true;
        setHasMore(hasMorePosts);

        // If all posts were duplicates, don't update the UI but keep hasMore state
        if (newUniquePostIds.length === 0) {
          setLoadingState(isInitialLoad, false);
          return;
        }

        // Update state with unique posts only
        const updatedPostIds = isInitialLoad ? newUniquePostIds : [...postIdsRef.current, ...newUniquePostIds];
        postIdsRef.current = updatedPostIds;
        setPostIds(updatedPostIds);
      } catch (err) {
        const errorMessage = isAppError(err) ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        setHasMore(false);
        Logger.error('Failed to fetch stream slice:', err);
        onError?.(err);
      } finally {
        setLoadingState(isInitialLoad, false);
      }
    },
    [streamId, lastPostId, streamTail, limit, setLoadingState, onError],
  );

  /**
   * Clears all state
   */
  const clearState = useCallback(() => {
    postIdsRef.current = [];
    skipOffsetRef.current = 0;
    setPostIds([]);
    setLastPostId(undefined);
    setStreamTail(0);
    setHasMore(true);
    setError(null);
  }, []);

  /**
   * Refresh function - clears state and fetches from beginning
   */
  const refresh = useCallback(async () => {
    clearState();
    await fetchStreamSlice(true);
  }, [clearState, fetchStreamSlice]);

  /**
   * Load more function - fetches next page
   */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    await fetchStreamSlice(false);
  }, [loadingMore, hasMore, fetchStreamSlice]);

  /**
   * Prepend post(s) to the start of the feed without re-sorting.
   * Use for curator-ordered feeds (collection items, bookmarks) where the newest
   * entry belongs at the head of the stream. Unlike `prependPosts` this preserves
   * the existing order instead of re-sorting by timestamp.
   */
  const prependItems = (postIds: string | string[]) => {
    const idsToAdd = Array.isArray(postIds) ? postIds : [postIds];
    const existingIds = new Set(postIdsRef.current);
    const newIds = idsToAdd.filter((id) => !existingIds.has(id));

    if (newIds.length === 0) {
      return;
    }

    const allIds = [...newIds, ...postIdsRef.current];
    postIdsRef.current = allIds;
    setPostIds(allIds);
  };

  /**
   * Add post(s) to the timeline, sorted by timestamp
   * Maintains chronological order (most recent first) when adding posts
   * @param postIds - A single post ID or array of post IDs to add
   */
  const prependPosts = useCallback(async (postIds: string | string[]) => {
    const idsToAdd = Array.isArray(postIds) ? postIds : [postIds];

    // Filter out posts that already exist to avoid duplicates
    const existingIds = new Set(postIdsRef.current);
    const newIds = idsToAdd.filter((id) => !existingIds.has(id));

    if (newIds.length === 0) {
      return;
    }

    // Combine new and existing posts
    const allIds = [...newIds, ...postIdsRef.current];

    try {
      // Fetch post details to get timestamps and sort
      const sortedIds = await sortPostIdsByTimestamp(allIds);
      postIdsRef.current = sortedIds;
      setPostIds(sortedIds);
    } catch (err) {
      Logger.error('Failed to prepend posts:', err);
      // Fallback: add without sorting
      postIdsRef.current = allIds;
      setPostIds(allIds);
    }
  }, []);

  /**
   * Remove post(s) from the timeline
   * Used when posts are deleted to immediately remove them from the UI
   * @param postIds - A single post ID or array of post IDs to remove
   */
  const removePosts = useCallback((postIds: string | string[]) => {
    const idsToRemove = Array.isArray(postIds) ? postIds : [postIds];
    const idsToRemoveSet = new Set(idsToRemove);

    const updatedPostIds = postIdsRef.current.filter((id) => !idsToRemoveSet.has(id));
    postIdsRef.current = updatedPostIds;
    setPostIds(updatedPostIds);
  }, []);

  // Initial load and reset when streamId changes
  useEffect(() => {
    if (resetOnStreamChange) {
      clearState();
    }
    fetchStreamSlice(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  return {
    postIds,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    prependPosts,
    prependItems,
    removePosts,
  };
}
