'use client';

import { useEffect } from 'react';
import { useArenaIdeas } from '@/hooks/useArenaIdeas/useArenaIdeas';
import { useStreamPagination } from '@/hooks/useStreamPagination/useStreamPagination';
import {
  ARENA_TIMEFRAME_PAGE_SIZE,
  rankArenaIdeasForTimeframe,
  shouldLoadMoreArenaTimeframe,
} from '@/libs/arena/arena';
import { buildSortedAuthorStreamId } from '@/models/stream/post/postStream.types';
import { StreamSorting } from '@/services/nexus/nexus.types';
import { TIMEFRAME, type TimeframeType } from '@/stores/hot/hot.types';

/** Rank the person's own original posts, independently of the profile-tag filter. */
export function useArenaPersonPost(author: string, postWindow: { timeframe: TimeframeType; now: number }) {
  const stream = useStreamPagination({
    streamId: buildSortedAuthorStreamId(StreamSorting.TIMELINE, author, 'all'),
    limit: ARENA_TIMEFRAME_PAGE_SIZE,
  });
  const { ideas, loading: readingIdeas, error: ideasError } = useArenaIdeas(stream.postIds);
  const { loading, loadingMore, hasMore, loadMore } = stream;
  const error = stream.error || ideasError;
  // Timeline pagination preserves the window boundary. All time checks every
  // page because Nexus's engagement order is not Arena's popularity formula.
  const needsMore =
    postWindow.timeframe === TIMEFRAME.ALL_TIME ||
    ideas.length === 0 ||
    shouldLoadMoreArenaTimeframe(ideas, postWindow.timeframe, postWindow.now);
  useEffect(() => {
    if (!loading && !loadingMore && !readingIdeas && !error && hasMore && needsMore) void loadMore();
  }, [loading, loadingMore, readingIdeas, error, hasMore, needsMore, loadMore]);
  const findingPost = !error && (loading || loadingMore || readingIdeas || (hasMore && needsMore));
  const post = rankArenaIdeasForTimeframe(
    ideas.filter((idea) => idea.author === author && !idea.replyTo),
    'popular',
    postWindow.timeframe,
    postWindow.now,
  )[0];
  return { post: findingPost || error ? undefined : post, loading: findingPost, error, retry: stream.refresh };
}
