'use client';

import { TagKind } from '@/application/tag/tag.types';
import { useEntityTaggers } from '@/hooks/useEntityTaggers/useEntityTaggers';
import type { UseEntityTaggersResult } from '@/hooks/useEntityTaggers/useEntityTaggers.types';

/**
 * Post-specific adapter retained for direct post tagger consumers.
 * @param postId - The composite post ID (author:postId format). Pass null/undefined to disable fetching.
 */
export function usePostTaggers(postId?: string | null): UseEntityTaggersResult {
  return useEntityTaggers(postId, TagKind.POST);
}
