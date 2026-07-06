'use client';

import { useRouter } from 'next/navigation';
import { getCollectionRoute } from '@/app/routes';
import { Container } from '@/atoms/Container/Container';
import { usePostDetails } from '@/hooks/usePostDetails/usePostDetails';
import { useTtlSubscription } from '@/hooks/useTtlSubscription/useTtlSubscription';
import { parseCompositeId } from '@/models/models.utils';
import { isCollectionPostsStream, type PostStreamId } from '@/models/stream/post/postStream.types';
import { CollectionCard } from '@/organisms/Collections/CollectionCard/CollectionCard';
import { CollectionCardSkeleton } from '@/organisms/Collections/CollectionCard/CollectionCard.skeleton';
import { PostMain } from '@/organisms/PostMain/PostMain';
import { TimelinePostReplies } from '../../PostReplies/PostReplies';

interface TimelineFeedItemShellProps {
  postId: string;
  index: number;
  totalCount: number;
  cardRef: (el: HTMLElement | null) => void;
  onPostKeyDown: (postId: string, event: React.KeyboardEvent) => void;
}

type TimelineFeedItemProps = TimelineFeedItemShellProps & {
  streamId: PostStreamId;
};

type TimelineCollectionFeedItemProps = TimelineFeedItemShellProps & {
  authorPubky: string;
  collectionPostId: string;
};

interface FeedItemArticleShellProps {
  'data-cy': string;
  index: number;
  totalCount: number;
  cardRef: (el: HTMLElement | null) => void;
  tabIndex?: number;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  children: React.ReactNode;
}

function FeedItemArticleShell({
  'data-cy': dataCy,
  index,
  totalCount,
  cardRef,
  tabIndex = 0,
  onKeyDown,
  children,
}: FeedItemArticleShellProps) {
  return (
    <Container
      ref={cardRef}
      data-cy={dataCy}
      overrideDefaults
      role="article"
      aria-posinset={index + 1}
      aria-setsize={totalCount}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Container>
  );
}

function TimelineCollectionFeedItem({
  postId,
  authorPubky,
  collectionPostId,
  index,
  totalCount,
  cardRef,
}: TimelineCollectionFeedItemProps) {
  const router = useRouter();
  const { ref: ttlRef } = useTtlSubscription({
    type: 'post',
    id: postId,
  });

  const handleCollectionKeyDown = (event: React.KeyboardEvent) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    router.push(getCollectionRoute(authorPubky, collectionPostId));
  };

  return (
    <FeedItemArticleShell
      data-cy="collection-card-feed-item"
      index={index}
      totalCount={totalCount}
      cardRef={(el) => {
        cardRef(el);
        ttlRef(el);
      }}
      onKeyDown={handleCollectionKeyDown}
    >
      <CollectionCard authorPubky={authorPubky} postId={collectionPostId} />
    </FeedItemArticleShell>
  );
}

function TimelineCollectionFeedItemSkeleton({
  index,
  totalCount,
  cardRef,
}: Pick<TimelineFeedItemShellProps, 'index' | 'totalCount' | 'cardRef'>) {
  return (
    <FeedItemArticleShell
      data-cy="collection-card-feed-item"
      index={index}
      totalCount={totalCount}
      cardRef={cardRef}
      tabIndex={-1}
    >
      <CollectionCardSkeleton />
    </FeedItemArticleShell>
  );
}

function TimelinePostFeedItem({ postId, index, totalCount, cardRef, onPostKeyDown }: TimelineFeedItemShellProps) {
  return (
    <FeedItemArticleShell
      data-cy="post-card"
      index={index}
      totalCount={totalCount}
      cardRef={cardRef}
      onKeyDown={(event) => onPostKeyDown(postId, event)}
    >
      <PostMain postId={postId} isReply={false} />
      <TimelinePostReplies postId={postId} />
    </FeedItemArticleShell>
  );
}

/**
 * TimelineFeedItem
 *
 * Renders a single feed entry. Collection-kind posts use a standalone
 * `CollectionCard` (matching `/collections`); everything else stays on
 * `PostMain` + inline replies.
 *
 * On collection-only streams, shows `CollectionCardSkeleton` while post
 * details are still resolving so the feed never flashes a post card shell.
 */
export function TimelineFeedItem({
  streamId,
  postId,
  index,
  totalCount,
  cardRef,
  onPostKeyDown,
}: TimelineFeedItemProps) {
  const { postDetails } = usePostDetails(postId);
  const isCollectionStream = isCollectionPostsStream(streamId);
  const shellProps = { postId, index, totalCount, cardRef, onPostKeyDown };

  if (isCollectionStream && postDetails === undefined) {
    return <TimelineCollectionFeedItemSkeleton index={index} totalCount={totalCount} cardRef={cardRef} />;
  }

  if (isCollectionStream || postDetails?.kind === 'collection') {
    const { pubky, id } = parseCompositeId(postId);
    return <TimelineCollectionFeedItem {...shellProps} authorPubky={pubky} collectionPostId={id} />;
  }

  return <TimelinePostFeedItem {...shellProps} />;
}
