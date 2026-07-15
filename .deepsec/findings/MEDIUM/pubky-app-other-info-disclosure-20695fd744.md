# [MEDIUM] Stale share-target files can leak across local sessions

**File:** [`src/app/share/page.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/app/share/page.tsx#L24) (lines 24)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `other-info-disclosure`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The share page renders ShareTarget, which reads /share?hasFiles=true and loads every file from the global Cache API cache named share-target-files. That cache is populated by the service worker for share-target POSTs and is only deleted after successful retrieval. AuthController.cleanupLocalState clears stores, cookies, IndexedDB, and query caches, but does not delete this Cache API entry. If one user shares files but closes the app, navigates away, or logs out before ShareTarget retrieves them, a later user in the same browser profile can visit /share?hasFiles=true and have those stale files attached to their composer. This crosses Pubky identities on a shared device and can disclose local shared files.

## Recommendation

Bind share-target cache entries to a one-time nonce in the POST redirect and only retrieve files when that nonce matches, then delete the cache. Also clear share-target-files during auth cleanup/sign-in and consider deleting stale cache entries whenever /share loads without a valid nonce.

## Revalidation

**Verdict:** true-positive

The share page itself only renders `ShareTarget`, but the imported template reads `hasFiles=true` from the query string and calls `getSharedFiles()` with no nonce, user binding, timestamp, or session check before passing the returned files into `PostInput` as initial attachments. The service worker stores all incoming Web Share Target files in the global Cache API cache named `share-target-files` under fixed keys like `/share-target-file/0`, and that cache is per browser origin rather than per Pubky identity. `getSharedFiles()` deletes the cache only after it sees and reads cache keys; if the original user closes the app, navigates away, logs out, or never reaches the retrieval path, the cache remains. `AuthController.cleanupLocalState()` resets stores, cookies, query clients, Dexie, coordinators, and related local state, but there is no `caches.delete('share-target-files')` or equivalent cleanup. `/share` is not available to unauthenticated users under `RouteGuardProvider`, but after a second user signs in on the same browser profile the authenticated route is allowed and `/share?hasFiles=true` will load the stale cache. `PostInput` applies `initialAttachments` on mount via `handleFilesAdded(initialAttachments)`, so the later user can see and use files shared by the previous local user. The concrete attack scenario is a shared device where User A shares local files into the PWA but does not complete the share page, logs out, and User B later signs in and opens `/share?hasFiles=true`, causing User A's cached files to be attached to User B's composer. The current git history does not show a nonce or cleanup patch after the share-target feature was introduced, so this remains exploitable in the reviewed commit.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-01)
- Ovi Trif <ovitrif@proton.me> (2026-02-03)
