'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FileController } from '@/controllers/file/file';
import { StreamUserController } from '@/controllers/stream/users/users';
import { UserController } from '@/controllers/user/user';
import { useArenaIdeas } from '@/hooks/useArenaIdeas/useArenaIdeas';
import { useArenaProfileTag } from '@/hooks/useArenaProfileTag/useArenaProfileTag';
import { useMutedUsers } from '@/hooks/useMutedUsers/useMutedUsers';
import { useStreamPagination } from '@/hooks/useStreamPagination/useStreamPagination';
import type { UserStreamUser } from '@/hooks/useUserStream/useUserStream.types';
import {
  ARENA_TIMEFRAME_PAGE_SIZE,
  getArenaCandidateStreamId,
  rankArenaIdeasForTimeframe,
  shouldLoadMoreArenaTimeframe,
} from '@/libs/arena/arena';
import { ARENA_PEOPLE_LIMIT } from '@/libs/arena/people';
import { CONTENT, type ReachType } from '@/stores/home/home.types';
import { TIMEFRAME, type TimeframeType } from '@/stores/hot/hot.types';

/** Discover recent authors from the timeline, independently of the active-user cohort. */
export function useArenaRecentPeople({
  timeframe,
  now,
  reach,
  topic,
}: {
  timeframe: TimeframeType;
  now: number;
  reach: ReachType;
  topic: string | null;
}) {
  const stream = useStreamPagination({
    // The topic filters profiles below; it must not restrict which posts count.
    streamId: getArenaCandidateStreamId(null, 'newest', timeframe, CONTENT.ALL, reach),
    limit: ARENA_TIMEFRAME_PAGE_SIZE,
    includeMuted: true,
  });
  // Keep muted posts here so the pagination cutoff still sees their timestamps.
  const { ideas, loading: readingIdeas, error: ideasError } = useArenaIdeas(stream.postIds, { includeMuted: true });
  const { isMuted } = useMutedUsers();
  const profileTag = useArenaProfileTag(topic);
  const recent = rankArenaIdeasForTimeframe(ideas, 'newest', timeframe, now);
  const authors = [...new Set(recent.map((idea) => idea.author))].filter(
    (id) => !isMuted(id) && (topic === null || profileTag.matchingIds?.has(id)),
  );
  const { loading, loadingMore, hasMore, loadMore } = stream;
  const sourceError = stream.error || ideasError || profileTag.error;
  const targetCount =
    topic === null
      ? ARENA_PEOPLE_LIMIT
      : Math.min(ARENA_PEOPLE_LIMIT, [...(profileTag.matchingIds ?? [])].filter((id) => !isMuted(id)).length);
  const needsMore =
    !profileTag.loading &&
    authors.length < targetCount &&
    (timeframe === TIMEFRAME.ALL_TIME || ideas.length === 0 || shouldLoadMoreArenaTimeframe(ideas, timeframe, now));

  useEffect(() => {
    if (!loading && !loadingMore && !readingIdeas && !sourceError && hasMore && needsMore) void loadMore();
  }, [loading, loadingMore, readingIdeas, sourceError, hasMore, needsMore, loadMore]);

  const findingPeople = loading || loadingMore || readingIdeas || profileTag.loading || (hasMore && needsMore);
  const idsKey = JSON.stringify(findingPeople || sourceError ? [] : authors.slice(0, ARENA_PEOPLE_LIMIT));
  const [attempt, setAttempt] = useState(0);
  const [hydration, setHydration] = useState<{ idsKey: string; error: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHydration(null);
    const hydrate = async () => {
      try {
        const userIds: string[] = JSON.parse(idsKey);
        if (userIds.length) await StreamUserController.getOrFetchUsers({ userIds });
        if (!cancelled) setHydration({ idsKey, error: null });
      } catch {
        if (!cancelled) setHydration({ idsKey, error: 'Could not load people.' });
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [idsKey, attempt]);

  const profiles = useLiveQuery(
    async () => {
      try {
        const userIds: string[] = JSON.parse(idsKey);
        const [details, counts] = await Promise.all([
          UserController.getManyDetails({ userIds }),
          UserController.getManyCounts({ userIds }),
        ]);
        const users: UserStreamUser[] = userIds.map((id) => {
          const profile = details.get(id);
          const stats = counts.get(id);
          return {
            id,
            name: profile?.name ?? '',
            bio: profile?.bio ?? '',
            image: profile?.image ?? null,
            avatarUrl: profile?.image ? FileController.getAvatarUrl(id) : null,
            status: profile?.status ?? null,
            counts: stats
              ? {
                  tags: stats.tagged,
                  posts: stats.posts,
                  replies: stats.replies,
                  followers: stats.followers,
                  following: stats.following,
                }
              : undefined,
          };
        });
        return { users, idsKey, error: null };
      } catch {
        return { users: [] as UserStreamUser[], idsKey, error: 'Could not load people.' };
      }
    },
    [idsKey, attempt],
    { users: [] as UserStreamUser[], idsKey: null as string | null, error: null as string | null },
  );
  const error =
    sourceError ||
    (hydration?.idsKey === idsKey ? hydration.error : null) ||
    (profiles.idsKey === idsKey ? profiles.error : null);

  return {
    users: profiles.idsKey === idsKey ? profiles.users : [],
    loading: !error && (findingPeople || hydration?.idsKey !== idsKey || profiles.idsKey !== idsKey),
    error,
    retry: () => {
      setAttempt((value) => value + 1);
      profileTag.retry();
      void stream.refresh();
    },
  };
}
