'use client';

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
  const idsKey = JSON.stringify([...new Set(postIds)]);
  return useLiveQuery(
    async () => {
      try {
        const ids: string[] = JSON.parse(idsKey);
        const records = await Promise.all(
          ids.map(async (compositeId) => {
            const { pubky: author } = parseCompositeId(compositeId);
            const [post, counts, relationships] = await Promise.all([
              PostController.getDetails({ compositeId }),
              PostController.getCounts({ compositeId }),
              PostController.getRelationships({ compositeId }),
            ]);
            if (!post || !counts || isPostDeleted(post.content) || mutedUserIdSet.has(author)) return null;
            return {
              id: compositeId,
              author,
              preview: post.is_blurred ? 'Content warning' : deriveTextPreview(post) || `${post.kind} post`,
              kind: post.kind,
              indexedAt: post.indexed_at,
              // Match the native post action bar: one count per distinct label.
              tags: counts.unique_tags,
              replies: counts.replies,
              reposts: counts.reposts,
              replyTo: relationships?.replied
                ? buildCompositeIdFromPubkyUri({ uri: relationships.replied, domain: CompositeIdDomain.POSTS })
                : null,
            } satisfies ArenaIdea;
          }),
        );
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
