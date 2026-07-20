'use client';

import { usePathname, useRouter } from 'next/navigation';
import { getPostReplyRoute, isPostRoute } from '@/app/routes';
import { useIsMobile } from '@/hooks/useIsMobile/useIsMobile';
import { usePostNavigation } from '@/hooks/usePostNavigation/usePostNavigation';
import { parseCompositeId } from '@/models/models.utils';
import type { UsePostReplyActionOptions, UsePostReplyActionResult } from './usePostReplyAction.types';

/**
 * Central reply-entry policy for the context-first mobile experiment.
 *
 * Keeping route awareness here prevents post surfaces from each reimplementing
 * viewport and pathname checks.
 */
export function usePostReplyAction(
  postId: string,
  { onDesktopReply }: UsePostReplyActionOptions = {},
): UsePostReplyActionResult {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { navigateToPost } = usePostNavigation();

  const openReply = () => {
    if (!isMobile) {
      onDesktopReply?.();
      return;
    }

    if (isPostRoute(pathname)) {
      const { pubky, id } = parseCompositeId(postId);
      router.push(getPostReplyRoute(pubky, id));
      return;
    }

    navigateToPost(postId);
  };

  return { openReply };
}
