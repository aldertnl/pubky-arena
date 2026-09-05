'use client';

import { useEffect } from 'react';
import { useArenaProfileTag } from '@/hooks/useArenaProfileTag/useArenaProfileTag';
import { useMutedUsers } from '@/hooks/useMutedUsers/useMutedUsers';
import { useUserStream } from '@/hooks/useUserStream/useUserStream';
import {
  ARENA_PEOPLE_LIMIT,
  ARENA_PEOPLE_PAGE_SIZE,
  type ArenaPeopleMetric,
  getArenaPeopleStreamId,
  rankArenaPeople,
} from '@/libs/arena/people';
import type { ReachType } from '@/stores/home/home.types';
import type { TimeframeType } from '@/stores/hot/hot.types';

/** Reuse the homepage's active-user stream and Search's exact profile-tag lookup. */
export function useArenaPeople({
  timeframe,
  reach,
  topic,
  metric,
}: {
  timeframe: TimeframeType;
  reach: ReachType;
  topic: string | null;
  metric: Exclude<ArenaPeopleMetric, 'newest'>;
}) {
  const stream = useUserStream({
    streamId: getArenaPeopleStreamId(timeframe, reach),
    limit: ARENA_PEOPLE_PAGE_SIZE,
    paginated: true,
    includeCounts: true,
  });
  const { isMuted } = useMutedUsers();
  const { matchingIds, loading: loadingTags, error: tagError, retry: retryTags } = useArenaProfileTag(topic);
  const users = rankArenaPeople(
    stream.users.filter((user) => !isMuted(user.id) && (topic === null || matchingIds?.has(user.id))),
    metric,
  );
  const error = tagError || stream.error;
  const { isLoading, isLoadingMore, hasMore, loadMore } = stream;
  // Count-based rankings must inspect the entire active cohort, not just the activity leaders.
  // An empty profile search needs no further active-user pages.
  const needsMore =
    !loadingTags &&
    (topic === null || Boolean(matchingIds?.size)) &&
    (metric !== 'active' || users.length < ARENA_PEOPLE_LIMIT);
  useEffect(() => {
    if (!isLoading && !isLoadingMore && !error && hasMore && needsMore) void loadMore();
  }, [isLoading, isLoadingMore, error, hasMore, needsMore, loadMore]);

  return {
    users: users.slice(0, ARENA_PEOPLE_LIMIT),
    loading: !error && (isLoading || loadingTags || (hasMore && needsMore)),
    error,
    retry: () => {
      retryTags();
      void stream.refetch();
    },
  };
}
