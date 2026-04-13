'use client';

import * as Core from '@/core';
import { useLocalFirstQuery } from '@/hooks/useLocalFirstQuery';
import * as Types from './index';

/**
 * Hook to get the current logged-in user's profile details.
 * Combines authentication state with live database queries.
 *
 * Uses the local-first query pattern (ADR-0011) via `useLocalFirstQuery`:
 * 1. queryFn (useLiveQuery): Reads current data reactively from local DB
 * 2. fetchFn (useEffect): When `fetchOnMiss` is true, fetches from Nexus on cache miss; when false (default), skips network fetch to avoid eager startup downloads
 *
 * @returns Object containing userDetails and currentUserPubky
 *
 * @example Default — local-only until something else has populated IndexedDB (e.g. bootstrap)
 * ```tsx
 * const { userDetails, currentUserPubky } = useCurrentUserProfile();
 * if (!userDetails) return <div>Not logged in</div>;
 * return <div>{userDetails.name}</div>;
 * ```
 *
 * @example Network fill on cache miss — settings / edit profile where the user must see fresh data
 * ```tsx
 * const { userDetails, currentUserPubky } = useCurrentUserProfile({ fetchOnMiss: true });
 * ```
 */
export function useCurrentUserProfile({
  fetchOnMiss = false,
}: Types.UseCurrentUserProfileParams = {}): Types.UseCurrentUserProfileResult {
  const currentUserPubky = Core.useAuthStore((state) => state.currentUserPubky);

  const { data: userDetails } = useLocalFirstQuery<Core.NexusUserDetails>({
    queryFn: () => Core.UserController.getDetails({ userId: currentUserPubky! }),
    fetchFn: () =>
      fetchOnMiss ? Core.UserController.fetchDetails({ userId: currentUserPubky! }) : Promise.resolve(undefined),
    deps: [currentUserPubky, fetchOnMiss],
    enabled: !!currentUserPubky,
  });

  return { userDetails, currentUserPubky };
}
