'use client';

import { useRouter } from 'next/navigation';
import { getPostReplyRoute } from '@/app/routes';
import { useIsMobile } from '@/hooks/useIsMobile/useIsMobile';
import { parseCompositeId } from '@/models/models.utils';
import type { UsePostReplyActionOptions, UsePostReplyActionResult } from './usePostReplyAction.types';

/**
 * Central reply-entry policy for the direct-composer mobile experiment.
 *
 * Keeping viewport awareness here prevents post surfaces from each
 * reimplementing the desktop/mobile split.
 */
export function usePostReplyAction(
  postId: string,
  { onDesktopReply }: UsePostReplyActionOptions = {},
): UsePostReplyActionResult {
  const router = useRouter();
  const isMobile = useIsMobile();

  const openReply = (targetPostId = postId) => {
    if (!isMobile && onDesktopReply) {
      onDesktopReply();
      return;
    }

    const { pubky, id } = parseCompositeId(targetPostId);
    router.push(getPostReplyRoute(pubky, id));
  };

  return { openReply };
}
