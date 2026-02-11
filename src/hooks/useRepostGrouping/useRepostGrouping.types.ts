import type { TimelineItem } from '@/core';

export interface UseRepostGroupingParams {
  /** Array of post IDs to potentially group */
  postIds: string[];
}

export interface UseRepostGroupingResult {
  /** Timeline items (single posts and repost groups) */
  items: TimelineItem[];
  /** Whether the grouping is still loading */
  isGrouping: boolean;
}
