'use client';

import * as Atoms from '@/atoms';
import * as Core from '@/core';
import * as Molecules from '@/molecules';

/**
 * SinglePostFilters
 *
 * Filter set for SinglePost page left panels.
 * Currently supports layout only.
 */
function SinglePostFilters() {
  const { layout, setLayout } = Core.useHomeStore();

  return (
    <Atoms.Container overrideDefaults className="flex flex-col gap-6">
      <Molecules.FilterLayout selectedTab={layout} onTabChange={setLayout} />
    </Atoms.Container>
  );
}

/**
 * SinglePostLeftSidebar
 *
 * Left sidebar for SinglePost page (desktop).
 */
export function SinglePostLeftSidebar() {
  return <SinglePostFilters />;
}

/**
 * SinglePostLeftDrawer
 *
 * Left drawer for SinglePost page (tablet/mobile).
 */
export function SinglePostLeftDrawer() {
  return <SinglePostFilters />;
}
