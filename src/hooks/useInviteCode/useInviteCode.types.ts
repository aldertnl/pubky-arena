/**
 * Result type for useInviteCode.
 */
export interface UseInviteCodeResult {
  /** The invite/signup code from Homegate, null if not yet fetched */
  inviteCode: string | null;
  /** The full invite URL (base URL + code), null if no code */
  inviteUrl: string | null;
  /** Whether an invite code fetch is in progress */
  isLoading: boolean;
  /** Error message from the last failed fetch attempt, null if none */
  error: string | null;
  /** Fetches a fresh invite code from the Homegate API. Returns true on success, false on failure. */
  fetchInviteCode: () => Promise<boolean>;
}
