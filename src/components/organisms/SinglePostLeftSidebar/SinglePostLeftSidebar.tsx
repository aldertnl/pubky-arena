'use client';

import { LeftSidebarFilters } from '@/organisms/LeftSidebarFilters';

/**
 * SinglePostLeftSidebar
 *
 * Left sidebar for SinglePost page (desktop). Reuses feed left filters with
 * reach/sort/content disabled; only layout is interactive.
 */
export function SinglePostLeftSidebar() {
  return <LeftSidebarFilters layoutOnly variant="sidebar" />;
}

/**
 * SinglePostLeftDrawer
 *
 * Left drawer for SinglePost page (tablet/mobile). Same filter set as sidebar.
 */
export function SinglePostLeftDrawer() {
  return <LeftSidebarFilters layoutOnly variant="drawer" />;
}
