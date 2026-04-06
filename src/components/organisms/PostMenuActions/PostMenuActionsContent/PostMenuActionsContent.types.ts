import type { MenuVariant } from '@/config/ui';

export interface PostMenuActionsContentProps {
  postId: string;
  variant: MenuVariant;
  /** Callback when any action completes (used to close menu) */
  onActionComplete: () => void;
  /** Callback when report action is clicked */
  onReportClick: () => void;
  /** Callback when edit action is clicked */
  onEditClick: () => void;
  /** Callback when delete action is clicked */
  onDeleteClick: () => void;
  /** Whether a delete operation is in progress */
  isDeleting: boolean;
  /** When set, shows "Undo repost" in the menu */
  currentUserRepostId?: string;
  /** Executes deletion (e.g. undo repost); must match PostMenuActions' useDeletePost */
  deletePost: (postId: string) => void | Promise<void>;
}
