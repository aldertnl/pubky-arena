'use client';

import BidirectionalList from 'broad-infinite-list/react';
import { TIMELINE_BIDIRECTIONAL_LIST_THRESHOLD_PX, TIMELINE_BIDIRECTIONAL_LIST_VIEW_COUNT } from '@/config';
import * as Atoms from '@/atoms';
import * as Molecules from '@/molecules';
import * as Organisms from '@/organisms';
import * as Hooks from '@/hooks';
import { TimelineListFooter, type TimelineListFooterContext } from '@/components/molecules/Timeline/TimelineListFooter';
import type { TagsLayout } from '../../PostMain/PostMain.types';

interface TimelinePostsProps {
  postIds: string[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<string[]>;
  tagsLayout?: TagsLayout;
}

/**
 * Extracted from the list `renderItem` so hooks run at component level.
 * Deleted posts are filtered upstream in TimelineFeedContent; this component
 * is a pure renderer that never returns null (list rows must be non-zero height).
 */
function TimelinePostItem({ postId, tagsLayout }: { postId: string; tagsLayout?: TagsLayout }) {
  const { navigateToPost } = Hooks.usePostNavigation();

  return (
    <Atoms.Container data-cy="post-card" overrideDefaults className="pb-4">
      <Organisms.PostMain
        postId={postId}
        onClick={() => navigateToPost(postId)}
        isReply={false}
        tagsLayout={tagsLayout}
      />
      <Organisms.TimelinePostReplies postId={postId} />
    </Atoms.Container>
  );
}

/**
 * TimelinePosts
 *
 * Bidirectional infinite list: only a capped window of posts is mounted in the DOM.
 * Off-screen posts are unmounted, freeing Dexie subscriptions, IntersectionObservers, and ResizeObservers.
 */
export function TimelinePosts({
  postIds,
  loading,
  loadingMore,
  error,
  hasMore,
  loadMore,
  tagsLayout,
}: TimelinePostsProps) {
  const { items, onItemsChange, onLoadMore, hasPrevious, hasNext } = Hooks.useTimelineBidirectionalItems({
    postIds,
    loadMore,
    hasMore,
    viewCount: TIMELINE_BIDIRECTIONAL_LIST_VIEW_COUNT,
  });

  const footerContext: TimelineListFooterContext = {
    loadingMore,
    error,
    hasMore,
    itemCount: postIds.length,
  };

  return (
    <Molecules.TimelineStateWrapper loading={loading} error={error} hasItems={postIds.length > 0}>
      <Atoms.Container data-cy="timeline-container">
        <Atoms.Container data-cy="timeline-posts" overrideDefaults>
          <BidirectionalList<string>
            useWindow
            items={items}
            itemKey={(id) => id}
            renderItem={(postId) => <TimelinePostItem postId={postId} tagsLayout={tagsLayout} />}
            onLoadMore={onLoadMore}
            onItemsChange={onItemsChange}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            viewCount={TIMELINE_BIDIRECTIONAL_LIST_VIEW_COUNT}
            threshold={TIMELINE_BIDIRECTIONAL_LIST_THRESHOLD_PX}
            spinnerRow={
              <Atoms.Container overrideDefaults className="flex justify-center py-4">
                <Molecules.TimelineLoadingMore />
              </Atoms.Container>
            }
            disable={(loading && postIds.length === 0) || loadingMore}
          />
          <TimelineListFooter context={footerContext} />
        </Atoms.Container>
      </Atoms.Container>
    </Molecules.TimelineStateWrapper>
  );
}
