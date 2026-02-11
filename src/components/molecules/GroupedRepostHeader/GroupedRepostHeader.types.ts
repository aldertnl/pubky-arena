import type { Pubky } from '@/core';

export interface GroupedRepostHeaderProps {
  /** List of user IDs who reposted */
  reposterIds: Pubky[];
  /** Whether the current user's repost is in this group */
  includesCurrentUser: boolean;
  /** Earliest timestamp among all reposts (for display) */
  earliestTimestamp: number;
  /** Whether the reposter list is expanded (controlled mode) */
  isExpanded?: boolean;
  /** Callback when header is clicked to toggle reposters overlay (multi-reposter only) */
  onExpandToggle?: () => void;
}

export interface GetFirstReposterNameParams {
  includesCurrentUser: boolean;
  isFirstReposterLoading: boolean;
  firstReposterProfile: { name?: string } | null | undefined;
  firstReposterId: Pubky;
  youLabel: string;
}
