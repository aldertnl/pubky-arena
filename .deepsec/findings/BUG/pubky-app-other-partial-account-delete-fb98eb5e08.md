# [BUG] Account deletion clears local data before remote deletion succeeds

**File:** [`src/core/application/profile/profile.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/application/profile/profile.ts#L152-L183) (lines 152, 154, 159, 173, 183)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-partial-account-delete`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

commitDelete clears all local IndexedDB-backed profile/social data before it lists or deletes the homeserver files. If HomeserverService.listAll or any subsequent deleteFile call fails after retries, the caller receives a deletion failure and the user remains signed in, but the local cache has already been wiped. In a local-first app this leaves the account in an inconsistent state and can drop local-only/pending state even though the remote account still exists.

## Recommendation

Delete and verify the homeserver data first, including profile.json, and only clear local IndexedDB after the remote deletion has completed successfully. If local cleanup must begin earlier, add a failure recovery path that rehydrates or restores local state before surfacing a retryable deletion error.

## Revalidation

**Verdict:** true-positive

The current code still matches the finding: ProfileController.commitDelete forwards directly to ProfileApplication.commitDelete, and that method awaits LocalProfileService.deleteAll() before building the homeserver base directory, listing files, or deleting any remote file. LocalProfileService.deleteAll() clears broad IndexedDB-backed user, post, stream, tag, TTL, connection, relationship, and notification tables in a Dexie transaction. HomeserverService.listAll can still fail after local deletion, and ProfileApplication.deleteFile retries non-404 failures only three times before throwing. The useDeleteAccount hook catches that error, shows a failure toast, resets deletion state, and returns without calling AuthController.logout, so the user can remain signed in with the remote account still present. There is no compensation or rehydration path after the local wipe. A concrete failure scenario is a successful local clear followed by a network or homeserver failure during listAll or one of the deleteFile calls. This is not an authorization bypass, but it is a real local-first consistency and data-loss bug.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-12)
- V <jovanovicv90@gmail.com> (2026-05-05)
