'use client';

import * as Molecules from '@/molecules';
import * as Organisms from '@/organisms';

import type { SinglePostProps } from './SinglePost.types';
import { TIMELINE_FEED_VARIANT } from '@/config';

/**
 * SinglePost Template
 *
 * Displays a single post page with:
 * - Main post card (FULL WIDTH) with tags panel in two-column layout
 * - Below:  Replies timeline
 *
 * This template uses a FIXED layout that doesn't change based on user preferences.
 * All hook logic is delegated to the SinglePostContent organism.
 */
export function SinglePost({ postId }: SinglePostProps) {
  return (
    <>
      {/* Mobile header */}
      <Molecules.MobileHeader showLeftButton={false} showRightButton={false} />

      {/* Main content container */}
      <Organisms.ContentLayout
        classNameWrapperContent="gap-0"
        feedVariant={TIMELINE_FEED_VARIANT.BOOKMARKS}
        leftSidebarContent={<Organisms.HomeFeedSidebar allowVisualLayout feedVariant={TIMELINE_FEED_VARIANT.HOME} />}
        rightSidebarContent={<Organisms.SinglePostSidebar postId={postId} />}
        leftDrawerContent={<Organisms.HomeFeedDrawer allowVisualLayout feedVariant={TIMELINE_FEED_VARIANT.HOME} />}
        rightDrawerContent={<Organisms.SinglePostDrawer postId={postId} />}
      >
        <Organisms.SinglePostContent postId={postId} />
      </Organisms.ContentLayout>

      {/* Mobile footer navigation */}
      <Molecules.MobileFooter />
    </>
  );
}
