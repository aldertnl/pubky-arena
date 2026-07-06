'use client';

import { Container } from '@/atoms/Container/Container';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll/useInfiniteScroll';
import { usePostListKeyboard } from '@/hooks/usePostListKeyboard/usePostListKeyboard';
import { usePostNavigation } from '@/hooks/usePostNavigation/usePostNavigation';
import type { PostStreamId } from '@/models/stream/post/postStream.types';
import { TimelineEndMessage } from '@/molecules/Timeline/TimelineEndMessage';
import { TimelineError } from '@/molecules/Timeline/TimelineError';
import { TimelineLoadingMore } from '@/molecules/Timeline/TimelineLoadingMore';
import { TimelineStateWrapper } from '@/molecules/Timeline/TimelineStateWrapper/TimelineStateWrapper';
import type { CollectionCardLayout } from '@/organisms/PostMain/PostMainLayoutRules';
import { TimelineFeedItem } from './FeedItem/TimelineFeedItem';

interface TimelinePostsProps {
  streamId: PostStreamId;
  postIds: string[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  collectionCardLayout?: CollectionCardLayout;
}

/**
 * TimelinePosts
 *
 * Presentational component that displays posts in a timeline with infinite scroll.
 * Receives all data and handlers from a parent component.
 *
 * The surface (TimelineFeedContent) wraps this in PostMainLayoutProvider so each
 * PostMain / nested reply inherits the active tags layout via context.
 */
export function TimelinePosts({
  streamId,
  postIds,
  loading,
  loadingMore,
  error,
  hasMore,
  loadMore,
  collectionCardLayout = 'default',
}: TimelinePostsProps) {
  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: loadingMore,
    threshold: 3000,
    debounceMs: 20,
  });

  const { handlePostKeyDown } = usePostNavigation();
  const { setCardRef, onListKeyDown } = usePostListKeyboard();

  return (
    <TimelineStateWrapper loading={loading} error={error} hasItems={postIds.length > 0}>
      <Container data-cy="timeline-container">
        <Container
          data-cy="timeline-posts"
          overrideDefaults
          role="feed"
          className="space-y-4"
          onKeyDown={onListKeyDown}
        >
          {postIds.map((postId, index) => (
            <TimelineFeedItem
              key={`main_${postId}`}
              streamId={streamId}
              postId={postId}
              index={index}
              totalCount={postIds.length}
              cardRef={setCardRef(index)}
              onPostKeyDown={handlePostKeyDown}
              collectionCardLayout={collectionCardLayout}
            />
          ))}

          {loadingMore && <TimelineLoadingMore />}

          {error && postIds.length > 0 && <TimelineError message={error} />}

          {!hasMore && !loadingMore && postIds.length > 0 && <TimelineEndMessage />}

          <Container overrideDefaults className="h-5" ref={sentinelRef} />
        </Container>
      </Container>
    </TimelineStateWrapper>
  );
}
