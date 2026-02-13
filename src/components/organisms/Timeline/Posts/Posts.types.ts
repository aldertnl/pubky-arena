import * as Core from '@/core';

export interface TimelinePostsProps {
  /**
   * Post IDs to display
   */
  postIds: string[];
  /**
   * Mapping of plain repost IDs to their original post info.
   * Used to display grouped repost headers instead of individual reposts.
   */
  plainRepostOriginals: Map<string, Core.PlainRepostInfo>;
  /**
   * Loading state
   */
  loading: boolean;
  /**
   * Loading more state (for pagination)
   */
  loadingMore: boolean;
  /**
   * Error message if any
   */
  error: string | null;
  /**
   * Whether there are more posts to load
   */
  hasMore: boolean;
  /**
   * Function to load more posts
   */
  loadMore: () => Promise<void>;
}
