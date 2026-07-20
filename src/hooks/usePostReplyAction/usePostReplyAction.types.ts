export interface UsePostReplyActionOptions {
  /** Desktop keeps the existing dialog-based reply experience. */
  onDesktopReply?: () => void;
}

export interface UsePostReplyActionResult {
  /**
   * Desktop: invoke the supplied dialog action.
   * Mobile: open the full-screen reply route directly from every post surface.
   */
  openReply: () => void;
}
