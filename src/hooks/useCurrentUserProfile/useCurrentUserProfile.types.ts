import * as Core from '@/core';

export interface UseCurrentUserProfileParams {
  /**
   * When true, fetches current-user details from network on local cache miss.
   * Defaults to false to avoid eager startup downloads.
   */
  fetchOnMiss?: boolean;
}

export interface UseCurrentUserProfileResult {
  userDetails: Core.NexusUserDetails | null | undefined;
  currentUserPubky: string | null;
}
