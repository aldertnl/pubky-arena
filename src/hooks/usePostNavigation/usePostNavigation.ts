'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { resolvePostHref } from '@/app/routes';
import type { PostNavigationKind, UsePostNavigationResult } from './usePostNavigation.types';

const INTERACTIVE_SELECTOR = 'a,button,input,textarea,select,label,[role="button"],[role="link"]';
const POST_NAVIGATION_ALLOW_SELECTOR = '[data-allow-post-navigation]';

function getEventTargetElement(target: EventTarget | null): Element | null {
  if (!target) return null;
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  const interactiveElement = getEventTargetElement(target)?.closest(INTERACTIVE_SELECTOR);
  return Boolean(interactiveElement && !interactiveElement.matches(POST_NAVIGATION_ALLOW_SELECTOR));
}

/**
 * usePostNavigation
 *
 * Shared hook for post navigation logic.
 * Handles routing to post detail pages, including new-tab opens
 * via Cmd/Ctrl/Shift+Click, middle-click, and Cmd/Ctrl/Shift+Enter
 * when a post wrapper is keyboard-focused.
 */
export function usePostNavigation(): UsePostNavigationResult {
  const router = useRouter();

  const getPostHref = useCallback((postId: string, kind?: PostNavigationKind) => resolvePostHref(postId, kind), []);

  const navigateToPost = useCallback(
    (postId: string, kind?: PostNavigationKind) => {
      router.push(getPostHref(postId, kind));
    },
    [router, getPostHref],
  );

  const handlePostClick = useCallback(
    (postId: string, event: React.MouseEvent, kind?: PostNavigationKind) => {
      if (isInteractiveTarget(event.target)) return;

      // Don't navigate if the user is selecting text inside the card.
      const selection = typeof window !== 'undefined' ? window.getSelection() : null;
      if (selection && selection.toString().length > 0) return;

      const href = getPostHref(postId, kind);
      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
      router.push(href);
    },
    [router, getPostHref],
  );

  const handlePostAuxClick = useCallback(
    (postId: string, event: React.MouseEvent, kind?: PostNavigationKind) => {
      if (event.button !== 1) return;
      if (isInteractiveTarget(event.target)) return;
      event.preventDefault();
      window.open(getPostHref(postId, kind), '_blank', 'noopener,noreferrer');
    },
    [getPostHref],
  );

  const handlePostKeyDown = useCallback(
    (postId: string, event: React.KeyboardEvent, kind?: PostNavigationKind) => {
      // Only act when the wrapper itself has focus, not a descendant (button, link, input).
      if (event.target !== event.currentTarget) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();

      const href = getPostHref(postId, kind);
      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
      router.push(href);
    },
    [router, getPostHref],
  );

  return { getPostHref, navigateToPost, handlePostClick, handlePostAuxClick, handlePostKeyDown };
}
