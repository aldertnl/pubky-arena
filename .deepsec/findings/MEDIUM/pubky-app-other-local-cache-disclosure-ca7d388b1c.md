# [MEDIUM] Stale shared files can leak across local sessions

**File:** [`src/sw.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/sw.ts#L14-L64) (lines 14, 35, 37, 51, 61, 63, 64)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `other-local-cache-disclosure`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The share target stores all shared files in a fixed origin-wide Cache API bucket (`share-target-files`) using predictable keys like `/share-target-file/0`, then redirects with only `hasFiles=true`. The consumer retrieves every key in that cache when that query flag is present. If the share flow is interrupted before the share page reads and deletes the cache, for example because `/share` is protected and the user is redirected while logged out, the files remain available to a later user/session in the same browser by visiting `/share?hasFiles=true`. This can disclose private files shared through the OS share sheet across Pubky identities on a shared device.

## Recommendation

Store each share under an unguessable nonce, include that nonce in the redirect, and have the share page read and delete only matching entries. Add a TTL/expiry cleanup path and clear the share-target cache on auth redirects/logout or when the share page mounts without a valid nonce.

## Revalidation

**Verdict:** true-positive

The service worker stores Web Share Target files in a fixed origin-wide Cache API bucket named share-target-files and uses predictable keys such as /share-target-file/0. The redirect only includes hasFiles=true and does not include any nonce, owner, expiry, or per-share identifier. The cache is deleted before storing a new file share and after successful retrieval, but if the share page never retrieves the files, the entries remain in the browser profile. RouteGuardProvider and routes.ts show that /share is not a public or unauthenticated route; it is only in the authenticated allowed routes, so a logged-out or profile-incomplete share flow can be redirected before ShareTarget mounts. ShareTarget calls getSharedFiles solely based on searchParams.get('hasFiles') === 'true'. getSharedFiles opens the same fixed cache, iterates every cache key, reconstructs File objects from all responses, and deletes the bucket only after that read. Therefore a later local user/session in the same browser profile can visit /share?hasFiles=true while authenticated and receive stale files from an earlier interrupted share. This is a local shared-device disclosure rather than a remote web attacker issue, but it is concrete and exploitable within that threat model.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- James <74595920+catch-21@users.noreply.github.com> (2026-02-25)
- Ovi Trif <ovitrif@proton.me> (2026-02-03)
- Kevin Karsopawiro <k.karsopawiro@gmail.com> (2025-12-13)
