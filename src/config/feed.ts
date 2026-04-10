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
 * Pixel overscan buffer for Virtuoso-based timeline lists.
 * Higher values keep more rows mounted off-screen (helps smaller viewports / scroll-back).
 */
export const TIMELINE_VIRTUOSO_OVERSCAN_PX = 2800;

/**
 * Minimum item count to render beyond the viewport on each side (Virtuoso `minOverscanItemCount`).
 * Complements pixel overscan when rows are tall or heights vary.
 */
export const TIMELINE_VIRTUOSO_MIN_OVERSCAN_ITEMS = { top: 10, bottom: 15 } as const;
