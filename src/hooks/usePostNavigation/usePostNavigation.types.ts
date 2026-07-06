import type React from 'react';

export type PostNavigationKind = string | null | undefined;

export interface UsePostNavigationResult {
  /**
   * Build the canonical detail URL for a composite post ID.
   * Pass `kind === 'collection'` to route to `/collections/...`.
   */
  getPostHref: (postId: string, kind?: PostNavigationKind) => string;
  /**
   * Navigate to a post or collection detail page using composite ID.
   */
  navigateToPost: (postId: string, kind?: PostNavigationKind) => void;
  /**
   * Click handler for clickable post wrappers (e.g., feed cards).
   * Plain left click → SPA navigation. Cmd/Ctrl/Shift+Click → opens in a new tab.
   */
  handlePostClick: (postId: string, event: React.MouseEvent, kind?: PostNavigationKind) => void;
  /**
   * Auxiliary-click handler. Middle-click (button === 1) opens the post in a new tab.
   */
  handlePostAuxClick: (postId: string, event: React.MouseEvent, kind?: PostNavigationKind) => void;
  /**
   * Keyboard handler for focusable post wrappers.
   * Enter / Space → SPA navigation. Cmd/Ctrl/Shift + Enter → opens in a new tab.
   * Only activates when the keydown originated on the wrapper itself (event.target === event.currentTarget).
   */
  handlePostKeyDown: (postId: string, event: React.KeyboardEvent, kind?: PostNavigationKind) => void;
}
