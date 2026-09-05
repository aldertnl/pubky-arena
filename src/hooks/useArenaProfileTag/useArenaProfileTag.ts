'use client';

import { useEffect, useState } from 'react';
import { SEARCH_PEOPLE_PAGE_SIZE } from '@/config/search';
import { SearchController } from '@/controllers/search/search';
import { canonicalizeTagLabel } from '@/libs/utils/utils';

/** Reuse Search's exact profile-tag lookup across the People rankings. */
export function useArenaProfileTag(topic: string | null) {
  const tag = topic === null ? null : canonicalizeTagLabel(topic);
  const [attempt, setAttempt] = useState(0);
  const [matches, setMatches] = useState<{ tag: string; ids: Set<string> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMatches(null);
    setError(null);
    if (tag === null) return;
    const fetchMatches = async () => {
      try {
        const ids = new Set<string>();
        let skip = 0;
        while (!cancelled) {
          const page = await SearchController.fetchUsersByTags({ tags: tag, skip, limit: SEARCH_PEOPLE_PAGE_SIZE });
          if (cancelled) return;
          for (const { user_id } of page) ids.add(user_id);
          skip += page.length;
          if (page.length < SEARCH_PEOPLE_PAGE_SIZE) break;
        }
        if (!cancelled) setMatches({ tag, ids });
      } catch {
        if (!cancelled) setError('Could not load profile tags.');
      }
    };
    void fetchMatches();
    return () => {
      cancelled = true;
    };
  }, [tag, attempt]);

  const matchingIds = matches?.tag === tag ? matches.ids : null;
  return {
    matchingIds,
    loading: tag !== null && matchingIds === null && !error,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
