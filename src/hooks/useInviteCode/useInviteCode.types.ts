export interface UseInviteCodeResult {
  /** The full invite URL (base URL + code), null if not yet fetched */
  inviteUrl: string | null;
  /** Whether an invite code fetch is in progress */
  isLoading: boolean;
  /** Fetches a fresh invite code from the Homegate API. Returns true on success, false on failure. */
  fetchInviteCode: () => Promise<boolean>;
}
