'use client';

import { useEffect, useState } from 'react';
import * as Config from '@/config';

export interface UseTimelineBidirectionalItemsOptions {
  postIds: string[];
  loadMore: () => Promise<string[]>;
  hasMore: boolean;
  viewCount: number;
}

/**
 * Keeps a sliding window of post IDs for {@link broad-infinite-list} `BidirectionalList`,
 * while `postIds` from {@link useStreamPagination} remains the full loaded list for cursors and New Posts.
 */
export function useTimelineBidirectionalItems({
  postIds,
  loadMore,
  hasMore,
  viewCount,
}: UseTimelineBidirectionalItemsOptions) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    if (postIds.length === 0) {
      setItems([]);
      return;
    }

    setItems((prev) => {
      if (prev.length === 0) {
        return postIds.slice(0, Math.min(viewCount, postIds.length));
      }

      if (postIds[0] !== prev[0]) {
        return postIds.slice(0, Math.min(viewCount, postIds.length));
      }

      const allowed = new Set(postIds);
      const filtered = prev.filter((id) => allowed.has(id));
      if (filtered.length !== prev.length) {
        return filtered;
      }

      return prev;
    });
  }, [postIds, viewCount]);

  async function onLoadMore(direction: 'up' | 'down', refItem: string): Promise<string[]> {
    const idx = postIds.indexOf(refItem);
    if (idx === -1) {
      return [];
    }

    if (direction === 'up') {
      if (idx === 0) {
        return [];
      }
      const start = Math.max(0, idx - Config.NEXUS_POSTS_PER_PAGE);
      return postIds.slice(start, idx);
    }

    const restInMemory = postIds.slice(idx + 1);
    if (restInMemory.length > 0) {
      return restInMemory;
    }

    if (!hasMore) {
      return [];
    }

    return loadMore();
  }

  const hasPrevious = items.length > 0 && postIds.indexOf(items[0]) > 0;
  const hasNext = hasMore || (items.length > 0 && postIds.indexOf(items[items.length - 1]) < postIds.length - 1);

  return {
    items,
    onItemsChange: setItems,
    onLoadMore,
    hasPrevious,
    hasNext,
  };
}
