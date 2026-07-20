export interface UsePostReplyActionOptions {
  /** Desktop keeps the existing dialog-based reply experience. */
  onDesktopReply?: () => void;
}

export interface UsePostReplyActionResult {
  /**
   * Desktop: invoke the supplied dialog action.
   * Mobile feed: open the post thread first.
   * Mobile collection: open the composer directly because the canonical
   * collection detail route has no reply entry point.
   * Mobile thread: open the full-screen reply route.
   */
  openReply: () => void;
}
