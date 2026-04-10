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
 * Initial virtual index for Virtuoso `firstItemIndex` (must stay positive).
 * Decremented in `useStreamPagination` when posts are prepended so window scroll stays stable.
 */
export const TIMELINE_VIRTUOSO_INITIAL_FIRST_ITEM_INDEX = 1_000_000;

/**
 * Pixel overscan for Virtuoso timeline lists (`overscan`).
 * Lower than the previous 2800px default to reduce off-screen measurement churn during scroll;
 * still above the 400px stress-test value to avoid obvious blank strips when scrolling quickly.
 */
export const TIMELINE_VIRTUOSO_OVERSCAN_PX = 800;

/**
 * Minimum rows rendered beyond the viewport (`minOverscanItemCount`).
 * Lighter than the previous 10/15 cap while still buffering tall/variable post cards.
 */
export const TIMELINE_VIRTUOSO_MIN_OVERSCAN_ITEMS = { top: 3, bottom: 4 } as const;
