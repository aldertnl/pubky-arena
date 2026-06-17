import type { ReactNode } from 'react';
import { TIMELINE_FEED_VARIANT, type TimelineFeedVariant } from '@/config/feed';

export interface TimelineFeedProps {
  /**
   * Variant determines which stream to fetch
   * - 'home': Uses global filters (sort, reach, content)
   * - 'custom': Uses custom filters (sort, reach, layout, content, tags)
   * - 'profile': Uses author stream from ProfileContext (all posts except collections)
   * - 'profile_collections': Uses the author's collection posts stream from ProfileContext
   * - 'hot': Uses engagement sorting with reach from hot store
   * - 'search': Uses tags from URL query params with sort/content filters
   * - 'collection': Uses a single collection's item stream from route params
   *
   * `bookmarks` is intentionally excluded: that surface renders through
   * `BookmarksItems`/`useBookmarksFeed`, not this stream-backed component.
   */
  variant: Exclude<TimelineFeedVariant, typeof TIMELINE_FEED_VARIANT.BOOKMARKS>;
  /**
   * Optional children to render above the timeline (e.g., PostInput)
   * Children can access prependPosts via TimelineFeedContext
   */
  children?: ReactNode;
  /**
   * Optional custom empty state for feed variants that forward one. Currently
   * used by the collection feed to replace the default "No posts found" copy.
   */
  emptyState?: ReactNode;
}

export interface TimelineFeedContextValue {
  /**
   * The variant of the feed providing this context. Lets descendants (e.g. the
   * save picker) tailor behavior to the feed they live in; for example,
   * removing a no-longer-bookmarked post from the grid only on the bookmarks
   * feed.
   */
  variant: TimelineFeedVariant;
  /**
   * Add post(s) to the timeline, sorted by timestamp
   * @param postIds - A single post ID or array of post IDs to add
   */
  prependPosts: (postIds: string | string[]) => Promise<void>;
  /**
   * Prepend post(s) to the start of the feed without re-sorting. Used for
   * curator-ordered feeds (collection items, bookmarks) where the newest entry
   * belongs at the head of the stream.
   * @param postIds - A single post ID or array of post IDs to add
   */
  prependItems: (postIds: string | string[]) => void;
  /**
   * Remove post(s) from the timeline
   * @param postIds - A single post ID or array of post IDs to remove
   */
  removePosts: (postIds: string | string[]) => void;
}
