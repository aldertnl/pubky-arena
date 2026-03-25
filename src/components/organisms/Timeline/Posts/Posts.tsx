'use client';

import { Virtuoso } from 'react-virtuoso';
import { TIMELINE_VIRTUOSO_OVERSCAN_PX } from '@/config';
import * as Core from '@/core';
import * as Atoms from '@/atoms';
import * as Molecules from '@/molecules';
import * as Organisms from '@/organisms';
import * as Hooks from '@/hooks';
import {
  TimelineVirtuosoFooter,
  type TimelineVirtuosoContext,
} from '@/components/molecules/Timeline/TimelineVirtuosoFooter';
import type { TagsLayout } from '../../PostMain/PostMain.types';
import { GroupedRepostPost } from './GroupedRepostPost';

interface TimelinePostsProps {
  items: Core.TimelineItem[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  tagsLayout?: TagsLayout;
}

const virtuosoComponents = { Footer: TimelineVirtuosoFooter };

function getItemKey(item: Core.TimelineItem): string {
  if (item.type === Core.TIMELINE_ITEM_TYPE.SINGLE) {
    return `main_${item.postId}`;
  }
  return `group_${item.originalPostId}`;
}

/**
 * TimelinePosts
 *
 * Virtualized timeline that only mounts posts near the viewport.
 * Off-screen posts are unmounted, freeing their Dexie subscriptions,
 * IntersectionObservers, and ResizeObservers.
 */
export function TimelinePosts({
  items,
  loading,
  loadingMore,
  error,
  hasMore,
  loadMore,
  tagsLayout,
}: TimelinePostsProps) {
  const { navigateToPost } = Hooks.usePostNavigation();

  const virtuosoContext: TimelineVirtuosoContext = {
    loadingMore,
    error,
    hasMore,
    itemCount: items.length,
  };

  return (
    <Molecules.TimelineStateWrapper loading={loading} error={error} hasItems={items.length > 0}>
      <Atoms.Container data-cy="timeline-container">
        <Atoms.Container data-cy="timeline-posts" overrideDefaults>
          <Virtuoso
            useWindowScroll
            data={items}
            context={virtuosoContext}
            overscan={TIMELINE_VIRTUOSO_OVERSCAN_PX}
            computeItemKey={(_index, item) => getItemKey(item)}
            endReached={() => {
              if (!loadingMore && hasMore) {
                void loadMore();
              }
            }}
            itemContent={(_index, item) => {
              if (item.type === Core.TIMELINE_ITEM_TYPE.REPOST_GROUP) {
                return (
                  <Atoms.Container data-cy="post-card" overrideDefaults className="pb-4">
                    <GroupedRepostPost
                      item={item}
                      onClick={() => navigateToPost(item.originalPostId)}
                      tagsLayout={tagsLayout}
                    />
                    <Organisms.TimelinePostReplies postId={item.originalPostId} />
                  </Atoms.Container>
                );
              }

              return (
                <Atoms.Container data-cy="post-card" overrideDefaults className="pb-4">
                  <Organisms.PostMain
                    postId={item.postId}
                    onClick={() => navigateToPost(item.postId)}
                    isReply={false}
                    tagsLayout={tagsLayout}
                  />
                  <Organisms.TimelinePostReplies postId={item.postId} />
                </Atoms.Container>
              );
            }}
            components={virtuosoComponents}
          />
        </Atoms.Container>
      </Atoms.Container>
    </Molecules.TimelineStateWrapper>
  );
}
