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
 * High `top` buffers scroll-up / prepend; trades more off-screen mounts for smoother upward scroll.
 */
export const TIMELINE_VIRTUOSO_MIN_OVERSCAN_ITEMS = { top: 30, bottom: 4 } as const;

/**
 * Default row height for Virtuoso (`defaultItemHeight`) before/while a row's measured height stabilizes.
 * Without this, posts that render thin "Loading…" lines then expand to full cards cause large scroll jumps.
 */
export const TIMELINE_VIRTUOSO_DEFAULT_ITEM_HEIGHT_PX = 320;

/**
 * Virtuoso `skipAnimationFrameInResizeObserver`: when true, item size updates from ResizeObserver
 * apply immediately instead of on the next animation frame — less flicker/jump with variable-height
 * rows and `firstItemIndex` prepend (see react-virtuoso #1096). May log benign measurement warnings
 * if row height changes while Virtuoso is measuring (#1049).
 */
export const TIMELINE_VIRTUOSO_SKIP_ANIMATION_FRAME_IN_RESIZE_OBSERVER = true;

/**
 * Minimum height for the post card body while details are loading (`PostMain`).
 * Aligns with {@link TIMELINE_VIRTUOSO_DEFAULT_ITEM_HEIGHT_PX} so Virtuoso's estimate matches DOM.
 */
export const TIMELINE_POST_CARD_LOADING_MIN_HEIGHT_PX = TIMELINE_VIRTUOSO_DEFAULT_ITEM_HEIGHT_PX;
