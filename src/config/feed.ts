/**
 * Feed-related UI constants shared across hooks, components, and templates.
 */
export const TIMELINE_FEED_VARIANT = {
  HOME: 'home',
  CUSTOM: 'custom',
  BOOKMARKS: 'bookmarks',
  PROFILE: 'profile',
  HOT: 'hot',
  SEARCH: 'search',
} as const;

export type TimelineFeedVariant = (typeof TIMELINE_FEED_VARIANT)[keyof typeof TIMELINE_FEED_VARIANT];

/**
 * Maximum rows kept mounted by `broad-infinite-list` `BidirectionalList` (`viewCount`).
 * Older rows are trimmed as the user scrolls; scrolling back loads slices from the full `postIds` list.
 */
export const TIMELINE_BIDIRECTIONAL_LIST_VIEW_COUNT = 50;

/**
 * Pixel distance from the top/bottom edge to trigger loading (`threshold` on `BidirectionalList`).
 */
export const TIMELINE_BIDIRECTIONAL_LIST_THRESHOLD_PX = 10;

/**
 * Minimum height for the post card body while details are loading (`PostMain`).
 */
export const TIMELINE_POST_CARD_LOADING_MIN_HEIGHT_PX = 320;
