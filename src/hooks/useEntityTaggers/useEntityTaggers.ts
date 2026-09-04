'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TagKind } from '@/application/tag/tag.types';
import { PostController } from '@/controllers/post/post';
import { UserController } from '@/controllers/user/user';
import { Logger } from '@/libs/logger/logger';
import type { Pubky } from '@/models/models.types';
import type { NexusTaggers } from '@/services/nexus/nexus.types';
import { MAX_TAGGER_PAGE_REQUESTS, TAGGERS_PAGE_SIZE } from './useEntityTaggers.constants';
import type { FetchTaggerPageParams, TaggersStateMap, UseEntityTaggersResult } from './useEntityTaggers.types';

async function fetchTaggerPage({
  taggedId,
  taggedKind,
  label,
  skip,
}: FetchTaggerPageParams): Promise<NexusTaggers | NexusTaggers[]> {
  switch (taggedKind) {
    case TagKind.POST:
      return await PostController.fetchTaggers({
        compositeId: taggedId,
        label,
        skip,
        limit: TAGGERS_PAGE_SIZE,
      });
    case TagKind.USER:
      return await UserController.fetchTaggers({
        user_id: taggedId,
        label,
        skip,
        limit: TAGGERS_PAGE_SIZE,
      });
    default: {
      const exhaustiveCheck: never = taggedKind;
      return exhaustiveCheck;
    }
  }
}

/**
 * Fetches and caches complete tagger lists for user or post tags on demand.
 *
 * The entity's initial tag response seeds the list. Expanding a tag then
 * retrieves the remaining pages from the matching user or post endpoint.
 */
export function useEntityTaggers(taggedId?: string | null, taggedKind?: TagKind | null): UseEntityTaggersResult {
  const [taggerStates, setTaggerStates] = useState<TaggersStateMap>(new Map());
  const statesRef = useRef(taggerStates);
  const requestGenerationRef = useRef(0);

  useEffect(() => {
    statesRef.current = taggerStates;
  }, [taggerStates]);

  useEffect(() => {
    requestGenerationRef.current += 1;
    statesRef.current = new Map();
    setTaggerStates(new Map());

    return () => {
      requestGenerationRef.current += 1;
    };
  }, [taggedId, taggedKind]);

  const fetchAllTaggers = useCallback(
    async (label: string, initialIds: Pubky[], totalCount?: number) => {
      if (!taggedId || !taggedKind) return;

      const requestGeneration = requestGenerationRef.current;
      const labelKey = label.toLowerCase();
      const existing = statesRef.current.get(labelKey);
      if (existing?.isLoading) return;
      if (existing && !existing.hasMore) return;
      if (existing && existing.totalCount !== undefined && existing.ids.length >= existing.totalCount) return;

      const seedIds = existing?.ids.length ? existing.ids : initialIds;

      setTaggerStates((previousStates) => {
        const nextStates = new Map(previousStates);
        nextStates.set(labelKey, {
          ids: seedIds,
          skip: seedIds.length,
          isLoading: true,
          hasMore: totalCount !== undefined ? seedIds.length < totalCount : true,
          totalCount,
        });
        return nextStates;
      });

      try {
        let skip = seedIds.length;
        let collectedIds = [...seedIds];
        let hasMore = totalCount !== undefined ? collectedIds.length < totalCount : true;
        let pageRequests = 0;

        while (hasMore && pageRequests < MAX_TAGGER_PAGE_REQUESTS) {
          pageRequests += 1;
          const response = await fetchTaggerPage({ taggedId, taggedKind, label, skip });
          if (requestGeneration !== requestGenerationRef.current) return;

          const pageTaggers = Array.isArray(response)
            ? response.flatMap((entry) => entry.users ?? [])
            : (response.users ?? []);
          if (pageTaggers.length === 0) {
            hasMore = false;
            break;
          }

          const uniqueCountBefore = new Set(collectedIds).size;
          collectedIds = Array.from(new Set([...collectedIds, ...pageTaggers])) as Pubky[];
          const uniqueCountAfter = new Set(collectedIds).size;

          if (uniqueCountAfter === uniqueCountBefore && totalCount === undefined) break;

          skip += pageTaggers.length;
          if (totalCount !== undefined) {
            hasMore = collectedIds.length < totalCount;
          } else if (pageTaggers.length < TAGGERS_PAGE_SIZE) {
            hasMore = false;
          }
        }

        if (requestGeneration !== requestGenerationRef.current) return;

        setTaggerStates((previousStates) => {
          const nextStates = new Map(previousStates);
          const currentState = nextStates.get(labelKey);
          if (!currentState) return previousStates;
          nextStates.set(labelKey, {
            ...currentState,
            ids: collectedIds,
            skip,
            isLoading: false,
            hasMore,
          });
          return nextStates;
        });
      } catch (error) {
        if (requestGeneration !== requestGenerationRef.current) return;

        Logger.error('[useEntityTaggers] Failed to fetch taggers', { taggedId, taggedKind, label, error });
        setTaggerStates((previousStates) => {
          const nextStates = new Map(previousStates);
          const currentState = nextStates.get(labelKey);
          if (!currentState) return previousStates;
          nextStates.set(labelKey, { ...currentState, isLoading: false });
          return nextStates;
        });
      }
    },
    [taggedId, taggedKind],
  );

  const taggersByLabel = new Map<string, Pubky[]>();
  taggerStates.forEach((value, key) => {
    taggersByLabel.set(key, value.ids);
  });

  return {
    taggersByLabel,
    taggerStates,
    fetchAllTaggers,
  };
}
