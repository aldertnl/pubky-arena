'use client';

import { useEffect, useState } from 'react';
import { useFollowUser } from '@/hooks/useFollowUser/useFollowUser';
import type { Pubky } from '@/models/models.types';

type UseWhoToFollowFollowPreservationParams = {
  resetKey?: string;
};

export function useWhoToFollowFollowPreservation({ resetKey }: UseWhoToFollowFollowPreservationParams = {}) {
  const [preservedFollowedUserIds, setPreservedFollowedUserIds] = useState<Pubky[]>([]);
  const { toggleFollow, isUserLoading, isLoading: isFollowPending } = useFollowUser();

  useEffect(() => {
    setPreservedFollowedUserIds((prev) => (prev.length > 0 ? [] : prev));
  }, [resetKey]);

  const updatePreservedUserIds = (userId: Pubky, isCurrentlyFollowing: boolean) => {
    setPreservedFollowedUserIds((prev) => {
      if (isCurrentlyFollowing) {
        return prev.filter((id) => id !== userId);
      }
      return prev.includes(userId) ? prev : [...prev, userId];
    });
  };

  const rollbackPreservedUserIds = (userId: Pubky, wasFollowing: boolean) => {
    setPreservedFollowedUserIds((prev) => {
      if (wasFollowing) {
        return prev.includes(userId) ? prev : [...prev, userId];
      }
      return prev.filter((id) => id !== userId);
    });
  };

  const handleFollowClick = async (userId: Pubky, isCurrentlyFollowing: boolean, displayName: string) => {
    updatePreservedUserIds(userId, isCurrentlyFollowing);

    const ok = await toggleFollow(userId, isCurrentlyFollowing, displayName);
    if (!ok) {
      rollbackPreservedUserIds(userId, isCurrentlyFollowing);
    }
  };

  return {
    preservedFollowedUserIds,
    handleFollowClick,
    isUserLoading,
    /**
     * True while any `handleFollowClick` is still committing. Relationship-derived state (e.g.
     * `isFollowing`, followed counts) lags behind the click until the local write lands, so
     * callers that act on that state should wait for this to clear.
     */
    isFollowPending,
    /** Keep a user visible after a follow committed outside `handleFollowClick` (e.g. Follow All). */
    preserveFollowedUser: (userId: Pubky) => updatePreservedUserIds(userId, false),
  };
}
