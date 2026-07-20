'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getPostReplyRoute, isPostRoute } from '@/app/routes';
import { useIsMobile } from '@/hooks/useIsMobile/useIsMobile';
import { usePostDetails } from '@/hooks/usePostDetails/usePostDetails';
import { usePostNavigation } from '@/hooks/usePostNavigation/usePostNavigation';
import { parseCompositeId } from '@/models/models.utils';
import type { UsePostReplyActionOptions, UsePostReplyActionResult } from './usePostReplyAction.types';

function getReplyRoute(postId: string) {
  const { pubky, id } = parseCompositeId(postId);
  return getPostReplyRoute(pubky, id);
}

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
  const { postDetails, isLoading } = usePostDetails(postId);
  const pendingPostIdRef = useRef<string | null>(null);

  useEffect(() => {
    const pendingPostId = pendingPostIdRef.current;
    if (!pendingPostId || isLoading) return;

    pendingPostIdRef.current = null;
    if (isPostRoute(pathname) || postDetails?.kind === 'collection') {
      router.push(getReplyRoute(pendingPostId));
      return;
    }

    navigateToPost(pendingPostId);
  }, [isLoading, navigateToPost, pathname, postDetails, router]);

  const openReply = (targetPostId = postId) => {
    if (!isMobile && onDesktopReply) {
      onDesktopReply();
      return;
    }

    // Collection posts are the deliberate context-first exception: `/post/...`
    // redirects to their canonical collection detail page, which has no reply
    // entry point. A list row may also target an original post rather than the
    // card's post, so route that explicit target directly and avoid a dead end.
    if (isPostRoute(pathname) || targetPostId !== postId) {
      router.push(getReplyRoute(targetPostId));
      return;
    }

    if (isLoading || postDetails === undefined) {
      pendingPostIdRef.current = targetPostId;
      return;
    }

    if (postDetails?.kind === 'collection') {
      router.push(getReplyRoute(targetPostId));
      return;
    }

    navigateToPost(targetPostId);
  };

  return { openReply };
}
