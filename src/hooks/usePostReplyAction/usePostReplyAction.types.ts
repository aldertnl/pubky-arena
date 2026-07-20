export interface UsePostReplyActionOptions {
  /** Desktop keeps the existing dialog-based reply experience. */
  onDesktopReply?: () => void;
}

export interface UsePostReplyActionResult {
  /**
   * Desktop: invoke the supplied dialog action when available; otherwise use
   * the mobile policy so a CSS-visible mobile entry can never become a no-op.
   * Mobile feed: open the post thread first.
   * Mobile collection: open the composer directly because the canonical
   * collection detail route has no reply entry point.
   * Mobile explicit list-row target: open that target's composer directly.
   * Mobile thread: open the full-screen reply route.
   */
  openReply: (targetPostId?: string) => void;
}
