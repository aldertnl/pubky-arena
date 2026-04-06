'use client';

import { TIMELINE_FEED_VARIANT } from '@/config';
import { LeftSidebarFilters, type LeftSidebarFiltersProps } from '@/organisms/LeftSidebarFilters';

type HomeFeedSidebarOptions = Omit<LeftSidebarFiltersProps, 'variant' | 'hideLayoutFilter'>;

/**
 * HomeFeedSidebar
 *
 * Left sidebar for Home feed (desktop) - manages filter state via Core.useHomeStore.
 * Desktop version with sticky positioning.
 */
export function HomeFeedSidebar({
  hideReachFilter = false,
  allowVisualLayout = false,
  layoutOnly = false,
  feedVariant = TIMELINE_FEED_VARIANT.HOME,
}: HomeFeedSidebarOptions) {
  return (
    <LeftSidebarFilters
      hideReachFilter={hideReachFilter}
      allowVisualLayout={allowVisualLayout}
      layoutOnly={layoutOnly}
      feedVariant={feedVariant}
      variant="sidebar"
    />
  );
}

/**
 * HomeFeedDrawer
 *
 * Left drawer for Home feed (tablet) - manages filter state via Core.useHomeStore.
 */
export function HomeFeedDrawer({
  hideReachFilter = false,
  allowVisualLayout = false,
  layoutOnly = false,
  feedVariant = TIMELINE_FEED_VARIANT.HOME,
}: HomeFeedSidebarOptions) {
  return (
    <LeftSidebarFilters
      hideReachFilter={hideReachFilter}
      allowVisualLayout={allowVisualLayout}
      layoutOnly={layoutOnly}
      feedVariant={feedVariant}
      variant="drawer"
    />
  );
}

/**
 * HomeFeedDrawerMobile
 *
 * Left drawer for Home feed (mobile) - manages filter state via Core.useHomeStore.
 * Note: Mobile version doesn't show layout filter.
 */
export function HomeFeedDrawerMobile({
  hideReachFilter = false,
  allowVisualLayout = false,
  layoutOnly = false,
  feedVariant = TIMELINE_FEED_VARIANT.HOME,
}: HomeFeedSidebarOptions) {
  return (
    <LeftSidebarFilters
      hideReachFilter={hideReachFilter}
      hideLayoutFilter
      allowVisualLayout={allowVisualLayout}
      layoutOnly={layoutOnly}
      feedVariant={feedVariant}
      variant="drawer"
    />
  );
}
