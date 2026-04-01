'use client';

import { ContentLayout } from '@/organisms/ContentLayout';

import type { SinglePostProps } from './SinglePost.types';
import { TIMELINE_FEED_VARIANT } from '@/config';
import { SinglePostContent } from '@/organisms/SinglePostContent';
import { SinglePostLeftDrawer, SinglePostLeftSidebar } from '@/organisms/SinglePostLeftSidebar';
import { SinglePostDrawer } from '@/organisms/SinglePostDrawer';
import { SinglePostSidebar } from '@/organisms/SinglePostSidebar';

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
      {/* Main content container */}
      <ContentLayout
        classNameWrapperContent="gap-0"
        feedVariant={TIMELINE_FEED_VARIANT.BOOKMARKS}
        leftSidebarContent={<SinglePostLeftSidebar />}
        rightSidebarContent={<SinglePostSidebar postId={postId} />}
        leftDrawerContent={<SinglePostLeftDrawer />}
        rightDrawerContent={<SinglePostDrawer postId={postId} />}
      >
        <SinglePostContent postId={postId} />
      </ContentLayout>
    </>
  );
}
