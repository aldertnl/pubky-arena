'use client';

import { useState, useEffect, useRef } from 'react';
import * as Core from '@/core';
import * as Hooks from '@/hooks';
import * as Libs from '@/libs';
import type { UseStreamPaginationOptions, UseStreamPaginationResult } from '../useStreamPagination';

type UseTimelineItemsOptions = UseStreamPaginationOptions;

interface UseTimelineItemsResult extends Omit<UseStreamPaginationResult, 'postIds'> {
  items: Core.TimelineItem[];
  postIds: string[];
}

/**
 * Hook that wraps useStreamPagination and groups plain reposts into
 * RepostGroupItems. Returns an array of TimelineItem[] for the UI.
 *
 * Calls StreamPostsController.getPlainRepostOriginals to identify plain
 * reposts, then uses the buildTimelineItems pipe to produce grouped items.
 */
export function useTimelineItems(options: UseTimelineItemsOptions): UseTimelineItemsResult {
  const pagination = Hooks.useStreamPagination(options);

  const [items, setItems] = useState<Core.TimelineItem[]>([]);
  const prevPostIdsRef = useRef<string[]>([]);

  const { postIds } = pagination;

  useEffect(() => {
    if (postIds === prevPostIdsRef.current) return;
    if (
      postIds.length === prevPostIdsRef.current.length &&
      postIds.every((id, i) => id === prevPostIdsRef.current[i])
    ) {
      return;
    }
    prevPostIdsRef.current = postIds;

    if (postIds.length === 0) {
      setItems([]);
      return;
    }

    let cancelled = false;

    async function groupPosts() {
      try {
        const plainRepostOriginals = await Core.StreamPostsController.getPlainRepostOriginals(postIds);
        if (cancelled) return;

        const timelineItems = Core.buildTimelineItems(postIds, plainRepostOriginals);
        setItems(timelineItems);
      } catch (error) {
        Libs.Logger.error('[useTimelineItems] Failed to group reposts', { error });
        if (!cancelled) {
          setItems(Core.buildTimelineItems(postIds, new Map()));
        }
      }
    }

    void groupPosts();

    return () => {
      cancelled = true;
    };
  }, [postIds]);

  return { ...pagination, items };
}
