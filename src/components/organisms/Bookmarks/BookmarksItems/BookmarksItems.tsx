'use client';

import { Container } from '@/atoms/Container/Container';
import { TIMELINE_FEED_VARIANT } from '@/config/feed';
import { useBookmarksFeed } from '@/hooks/useBookmarksFeed/useBookmarksFeed';
import { CollectionEmptyState } from '@/molecules/CollectionEmptyState/CollectionEmptyState';
import { AddContentDialog } from '@/organisms/AddContentDialog/AddContentDialog';
import { PostMainLayoutProvider } from '@/organisms/PostMain/PostMainLayoutContext';
import type { TimelineFeedContextValue } from '@/organisms/Timeline/Feed/TimelineFeed/TimelineFeed.types';
import { TimelineFeedContext } from '@/organisms/Timeline/Feed/TimelineFeed/TimelineFeedContext';
import { TimelineGridPosts } from '@/organisms/Timeline/Posts/GridPosts/GridPosts';

/**
 * BookmarksItems
 *
 * Saved-posts grid rendered from the local `bookmarks` table via
 * `useBookmarksFeed` (live query + background Nexus seed), replacing the old
 * stream-cache feed so a stale re-seed can no longer drop a freshly-added
 * bookmark.
 *
 * Bookmarks always belong to the current user, so the add-content CTA renders
 * for every state. A `TimelineFeedContext` is still provided (variant
 * `BOOKMARKS`) so descendants keep working unchanged: `AddContentDialog`
 * prepends optimistically via `prependItems`, and `PostSavePicker` removes a
 * no-longer-bookmarked card via `removePosts` when its menu closes.
 */
export function BookmarksItems() {
  const { postIds, loading, loadingMore, error, hasMore, loadMore, prependItems, prependPosts, removePosts } =
    useBookmarksFeed();

  const contextValue: TimelineFeedContextValue = {
    variant: TIMELINE_FEED_VARIANT.BOOKMARKS,
    prependPosts,
    prependItems,
    removePosts,
  };

  return (
    <TimelineFeedContext.Provider value={contextValue}>
      <PostMainLayoutProvider tagsLayout="inline">
        <Container className="min-w-0 flex-1 gap-6">
          <AddContentDialog target={{ kind: 'bookmark' }} />
          <TimelineGridPosts
            postIds={postIds}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            hasMore={hasMore}
            loadMore={loadMore}
            showEndMessage={false}
            emptyState={<CollectionEmptyState />}
          />
        </Container>
      </PostMainLayoutProvider>
    </TimelineFeedContext.Provider>
  );
}
