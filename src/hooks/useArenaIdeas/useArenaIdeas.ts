'use client';

import { useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PostController } from '@/controllers/post/post';
import { useMutedUsers } from '@/hooks/useMutedUsers/useMutedUsers';
import type { ArenaIdea } from '@/libs/arena/arena';
import { Logger } from '@/libs/logger/logger';
import { deriveTextPreview } from '@/libs/post/postPreview';
import { isPostDeleted } from '@/libs/utils/utils';
import { CompositeIdDomain } from '@/models/models.types';
import { buildCompositeIdFromPubkyUri, parseCompositeId } from '@/models/models.utils';

/** Read the stream's persisted entities reactively, including optimistic count changes. */
export function useArenaIdeas(postIds: string[]) {
  const { mutedUserIdSet } = useMutedUsers();
  const cache = useRef(new Map<string, { content: string; blurred: boolean; idea: ArenaIdea }>());
  const idsKey = JSON.stringify([...new Set(postIds)]);
  return useLiveQuery(
    async () => {
      try {
        const ids: string[] = JSON.parse(idsKey);
        const snapshots = await PostController.getManySnapshots({ compositeIds: ids });
        const nextCache: typeof cache.current = new Map();
        const records = ids.map((compositeId) => {
          const { pubky: author } = parseCompositeId(compositeId);
          const snapshot = snapshots.get(compositeId);
          if (!snapshot) return null;
          const { details: post, counts, relationships } = snapshot;
          if (!post || !counts || isPostDeleted(post.content) || mutedUserIdSet.has(author)) return null;
          const previous = cache.current.get(compositeId);
          const sameContent =
            previous?.content === post.content &&
            previous.blurred === post.is_blurred &&
            previous.idea.kind === post.kind;
          const idea: ArenaIdea = {
            id: compositeId,
            author,
            preview: sameContent
              ? previous.idea.preview
              : post.is_blurred
                ? 'Content warning'
                : deriveTextPreview(post) || `${post.kind} post`,
            kind: post.kind,
            indexedAt: post.indexed_at,
            // Match the native post action bar: one count per distinct label.
            tags: counts.unique_tags,
            replies: counts.replies,
            reposts: counts.reposts,
            replyTo: relationships?.replied
              ? buildCompositeIdFromPubkyUri({ uri: relationships.replied, domain: CompositeIdDomain.POSTS })
              : null,
          };
          const unchanged =
            sameContent && (Object.keys(idea) as (keyof ArenaIdea)[]).every((key) => previous.idea[key] === idea[key]);
          const result = unchanged ? previous.idea : idea;
          nextCache.set(compositeId, { content: post.content, blurred: post.is_blurred, idea: result });
          return result;
        });
        cache.current = nextCache;
        return { ideas: records.filter((idea): idea is ArenaIdea => idea !== null), error: null };
      } catch (error) {
        Logger.error('[useArenaIdeas] Could not read contenders', { error });
        return { ideas: [] as ArenaIdea[], error: 'Could not load contenders. Try again.' };
      }
    },
    [idsKey, mutedUserIdSet],
    { ideas: [] as ArenaIdea[], error: null as string | null },
  );
}
