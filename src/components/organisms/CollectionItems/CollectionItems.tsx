'use client';

import { TIMELINE_FEED_VARIANT } from '@/config/feed';
import { usePostDetails } from '@/hooks/usePostDetails/usePostDetails';
import { parseCollectionContent } from '@/libs/post/collectionContent';
import { buildCompositeId } from '@/models/models.utils';
import { CollectionEmptyState } from '@/molecules/CollectionEmptyState/CollectionEmptyState';
import { AddContentDialog } from '@/organisms/AddContentDialog/AddContentDialog';
import { TimelineFeed } from '@/organisms/Timeline/Feed/TimelineFeed/TimelineFeed';
import { useAuthStore } from '@/stores/auth/auth.store';
import type { CollectionItemsProps } from './CollectionItems.types';

/**
 * CollectionItems
 *
 * Middle region of the single-collection view. Owner views render the
 * infinite-scroll grid of the collection's items (`TimelineFeed` with the
 * `COLLECTION` variant) with the add-content CTA above it; when the collection
 * is empty the feed shows the shared "This collection is empty." message
 * instead of the generic timeline "No posts found" copy. Other users' empty
 * collections render that same empty message without the CTA.
 *
 * Item membership is read from the parsed envelope (`items.length`), the source
 * of truth for the collection. While the envelope is still resolving we render
 * the feed (which shows its own grid skeleton); the empty state appears only
 * once the envelope is confirmed empty, so a populated collection never flashes
 * the placeholder.
 */
export function CollectionItems({ authorPubky, postId }: CollectionItemsProps) {
  const compositeId = buildCompositeId({ pubky: authorPubky, id: postId });
  const { postDetails } = usePostDetails(compositeId);

  const currentUserPubky = useAuthStore((state) => state.currentUserPubky);
  const isOwn = currentUserPubky === authorPubky;

  // Not-found / deleted collections are gated out upstream by the `Collection`
  // template (which renders `CollectionNotFound` instead), so by the time this
  // renders `postDetails` is a resolved collection envelope. The `null` branch
  // here stays as a defensive fall-through to the feed's own empty/error state.
  const collection = postDetails ? parseCollectionContent(postDetails.content) : null;
  const isConfirmedEmpty = collection != null && (collection.items?.length ?? 0) === 0;

  // Other users' empty collections: plain empty message, no add-content CTA.
  if (isConfirmedEmpty && !isOwn) {
    return <CollectionEmptyState />;
  }

  // Owner views (empty or populated): feed + add-content CTA. The CTA prepends
  // optimistically through TimelineFeedContext (read inside AddContentDialog),
  // and the empty grid falls back to the shared collection-empty message.
  if (isOwn && collection) {
    return (
      <TimelineFeed variant={TIMELINE_FEED_VARIANT.COLLECTION} emptyState={<CollectionEmptyState />}>
        <AddContentDialog target={{ kind: 'collection', collectionId: compositeId, collectionName: collection.name }} />
      </TimelineFeed>
    );
  }

  return <TimelineFeed variant={TIMELINE_FEED_VARIANT.COLLECTION} />;
}
