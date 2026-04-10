'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as Config from '@/config';
import type { VisualRow } from './TimelineFeedVisual.types';

export interface UseVisualTimelineBidirectionalRowsOptions {
  rows: VisualRow[];
  loadMore: () => Promise<string[]>;
  hasMore: boolean;
  viewCount: number;
}

/**
 * Sliding window of visual grid rows for {@link broad-infinite-list} `BidirectionalList`,
 * while `rows` from {@link useVisualFeedTiles} reflects the full derived layout from loaded `postIds`.
 */
export function useVisualTimelineBidirectionalRows({
  rows,
  loadMore,
  hasMore,
  viewCount,
}: UseVisualTimelineBidirectionalRowsOptions) {
  const rowsRef = useRef(rows);
  useLayoutEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const [items, setItems] = useState<VisualRow[]>([]);

  useEffect(() => {
    if (rows.length === 0) {
      setItems([]);
      return;
    }

    setItems((prev) => {
      if (prev.length === 0) {
        return rows.slice(0, Math.min(viewCount, rows.length));
      }

      if (rows[0]?.key !== prev[0]?.key) {
        return rows.slice(0, Math.min(viewCount, rows.length));
      }

      const keys = new Set(rows.map((r) => r.key));
      const filtered = prev.filter((r) => keys.has(r.key));
      if (filtered.length !== prev.length) {
        return filtered;
      }

      return prev;
    });
  }, [rows, viewCount]);

  async function onLoadMore(direction: 'up' | 'down', refItem: VisualRow): Promise<VisualRow[]> {
    const full = rowsRef.current;
    const idx = full.findIndex((r) => r.key === refItem.key);
    if (idx === -1) {
      return [];
    }

    if (direction === 'up') {
      if (idx === 0) {
        return [];
      }
      const start = Math.max(0, idx - Config.NEXUS_POSTS_PER_PAGE);
      return full.slice(start, idx);
    }

    const restInMemory = full.slice(idx + 1);
    if (restInMemory.length > 0) {
      return restInMemory;
    }

    if (!hasMore) {
      return [];
    }

    await loadMore();

    for (let n = 0; n < 24; n++) {
      await new Promise((r) => requestAnimationFrame(r));
      const latest = rowsRef.current;
      const j = latest.findIndex((r) => r.key === refItem.key);
      if (j === -1) {
        continue;
      }
      const tail = latest.slice(j + 1);
      if (tail.length > 0) {
        return tail;
      }
    }

    return [];
  }

  const firstItemKey = items[0]?.key;
  const lastItemKey = items[items.length - 1]?.key;

  const hasPrevious =
    items.length > 0 && firstItemKey !== undefined && rows.findIndex((r) => r.key === firstItemKey) > 0;

  const hasNext =
    hasMore ||
    (items.length > 0 && lastItemKey !== undefined && rows.findIndex((r) => r.key === lastItemKey) < rows.length - 1);

  return {
    items,
    onItemsChange: setItems,
    onLoadMore,
    hasPrevious,
    hasNext,
  };
}
