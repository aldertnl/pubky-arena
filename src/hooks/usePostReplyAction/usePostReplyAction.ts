'use client';

import { usePathname, useRouter } from 'next/navigation';
import { getPostReplyRoute, isPostRoute } from '@/app/routes';
import { useIsMobile } from '@/hooks/useIsMobile/useIsMobile';
import { usePostDetails } from '@/hooks/usePostDetails/usePostDetails';
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
  const { postDetails } = usePostDetails(postId);

  const openReply = (targetPostId = postId) => {
    if (!isMobile) {
      onDesktopReply?.();
      return;
    }

    // Collection posts are the deliberate context-first exception: `/post/...`
    // redirects to their canonical collection detail page, which has no reply
    // entry point. A list row may also target an original post rather than the
    // card's post, so route that explicit target directly and avoid a dead end.
    if (isPostRoute(pathname) || targetPostId !== postId || postDetails?.kind === 'collection') {
      const { pubky, id } = parseCompositeId(targetPostId);
      router.push(getPostReplyRoute(pubky, id));
      return;
    }

    navigateToPost(targetPostId);
  };

  return { openReply };
}
