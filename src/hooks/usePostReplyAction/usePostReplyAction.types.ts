export interface UsePostReplyActionOptions {
  /** Desktop keeps the existing dialog-based reply experience. */
  onDesktopReply?: () => void;
}

export interface UsePostReplyActionResult {
  /**
   * Desktop: invoke the supplied dialog action when available; otherwise use
   * the route fallback so a CSS-visible mobile entry can never become a no-op.
   * Mobile: open the full-screen reply route directly from every post surface.
   */
  openReply: (targetPostId?: string) => void;
}
