# [BUG] Timed-out migration resync continues after the guard unblocks

**File:** [`src/providers/RouteGuardProvider/RouteGuardProvider.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/providers/RouteGuardProvider/RouteGuardProvider.tsx#L89-L114) (lines 89, 102, 113, 114)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-race-condition`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The migration effect races MigrationController.resync(currentUserPubky) against a 10-second timeout. When the timeout wins, the finally block resets the migration flags and running guard, but the underlying resync promise is not canceled. That resync path writes mute/feed/settings data through the migration applications, so it can finish after logout or account switch and apply stale account settings or local cache data after cleanup.

## Recommendation

Make migration resync cancellable with an AbortSignal, or wait for it to settle before clearing the running state. Also verify that the current auth pubky still matches the resync pubky before applying settings or local writes.

## Revalidation

**Verdict:** true-positive

RouteGuardProvider races MigrationController.resync(currentUserPubky) against a 10-second timeout and never cancels the resync promise when the timeout wins. The finally block clears the migration flag and running ref regardless, so the UI can unblock while the original resync keeps executing in the background. MigrationController.resync snapshots local settings, awaits MigrationApplication.resync, and then applies returned settings to the Zustand store and locale cookie without checking that the current auth pubky still matches the pubky captured at effect start. MigrationApplication.resync calls MuteApplication.fetchMutedUsers, FeedApplication.fetchFeeds, and SettingsApplication.initializeSettings; those paths persist muted users and feeds locally, and settings sync can also write local settings back to homeserver when local wins or remote settings are absent. A concrete stale-state scenario is a slow post-migration resync timing out, the user logging out or switching accounts, and the old resync later writing old muted/feed data or loading old settings after cleanup. HomeserverService ownership checks reduce this from a cross-account homeserver write vulnerability, because non-owned pubky writes after an account switch should be rejected. That mitigation does not stop local IndexedDB/store corruption, because the migration applications have no AbortSignal and no current-user guard before their local writes or settings application. The finding is therefore a real BUG, not a higher-severity security issue.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-07-07)
