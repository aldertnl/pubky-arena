'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Container } from '@/atoms/Container/Container';
import { Heading } from '@/atoms/Heading/Heading';
import { Typography } from '@/atoms/Typography/Typography';
import { COLLECTIONS_SECTION_PAGE_SIZE, COLLECTIONS_SECTION_SKELETON_COUNT } from '@/config/collections';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll/useInfiniteScroll';
import { useStreamPagination } from '@/hooks/useStreamPagination/useStreamPagination';
import { parseCompositeId } from '@/models/models.utils';
import { buildDiscoverCollectionsStreamId } from '@/models/stream/post/postStream.types';
import { AvatarStack } from '@/molecules/AvatarStack/AvatarStack';
import { AvatarStackSkeleton } from '@/molecules/AvatarStack/AvatarStack.skeleton';
import { useToast } from '@/molecules/Toaster/use-toast';
import { CollectionCard } from '@/organisms/Collections/CollectionCard/CollectionCard';
import { CollectionCardSkeleton } from '@/organisms/Collections/CollectionCard/CollectionCard.skeleton';
import { uniqueAuthors } from '@/organisms/Collections/collections.utils';
import { useAuthStore } from '@/stores/auth/auth.store';

function DiscoverHeader({ children }: { children: React.ReactNode }) {
  const t = useTranslations('collections');
  return (
    <Container overrideDefaults className="flex items-center gap-3">
      <Heading level={2} size="lg" className="font-light text-muted-foreground">
        {t('discover.title')}
      </Heading>
      {children}
    </Container>
  );
}

/**
 * "Discover Collections": pages the global engagement stream (`total_engagement:all:collection`)
 * via the shared `useStreamPagination` + `useInfiniteScroll` (auto-load, like every other feed).
 * The viewer's own, already-bookmarked, and empty collections are filtered for this stream in the
 * shared stream layer (deleted posts are already dropped there for every feed; see `filterStreamPosts`
 * and the `getOrFetchStreamSlice` filter callback), so `postIds` is already the visible list: no
 * component overlay, and `reachedEnd` bounds pagination exactly like the Popularity/Home walk past a
 * muted region.
 *
 * The data layer is gated on auth hydration so the viewer is settled before the first fetch and
 * own-collection filtering applies from the first paint.
 */
export function DiscoverCollections() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  if (!hasHydrated) {
    return (
      <Container overrideDefaults className="flex w-full flex-col gap-4">
        <DiscoverHeader>
          <AvatarStackSkeleton count={3} size="md" />
        </DiscoverHeader>
        <Container overrideDefaults className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-6">
          {Array.from({ length: COLLECTIONS_SECTION_SKELETON_COUNT }).map((_, index) => (
            <CollectionCardSkeleton key={`discover-collections-skeleton-${index}`} />
          ))}
        </Container>
      </Container>
    );
  }
  return <DiscoverCollectionsContent />;
}

function DiscoverCollectionsContent() {
  const t = useTranslations('collections');
  const { toast } = useToast();
  const streamId = buildDiscoverCollectionsStreamId();

  const { postIds, loading, loadingMore, hasMore, loadMore } = useStreamPagination({
    streamId,
    limit: COLLECTIONS_SECTION_PAGE_SIZE,
    onError: () => toast({ variant: 'error', description: t('loadFailed') }),
  });

  const { sentinelRef } = useInfiniteScroll({ onLoadMore: loadMore, hasMore, isLoading: loadingMore });

  const headerPubkys = uniqueAuthors(postIds);
  const showSkeletons = loading && postIds.length === 0;
  const showEmpty = !loading && !hasMore && postIds.length === 0;

  return (
    <Container overrideDefaults className="flex w-full flex-col gap-4">
      <DiscoverHeader>
        {showSkeletons ? <AvatarStackSkeleton count={3} size="md" /> : <AvatarStack pubkys={headerPubkys} />}
      </DiscoverHeader>

      {showEmpty ? (
        <Typography overrideDefaults className="text-sm text-muted-foreground">
          {t('discover.empty')}
        </Typography>
      ) : (
        <Container overrideDefaults className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-6">
          {showSkeletons
            ? Array.from({ length: COLLECTIONS_SECTION_SKELETON_COUNT }).map((_, index) => (
                <CollectionCardSkeleton key={`discover-collections-skeleton-${index}`} />
              ))
            : postIds.map((compositeId) => {
                const { pubky, id } = parseCompositeId(compositeId);
                return <CollectionCard key={compositeId} authorPubky={pubky} postId={id} />;
              })}
        </Container>
      )}

      {/* Auto-load sentinel, gated on !showSkeletons so it isn't observed during the initial load. */}
      {!showEmpty && !showSkeletons && hasMore && (
        <Container ref={sentinelRef} overrideDefaults className="flex w-full justify-center py-2">
          {loadingMore && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </Container>
      )}
    </Container>
  );
}
