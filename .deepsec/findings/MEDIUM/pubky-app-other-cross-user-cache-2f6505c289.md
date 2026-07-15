# [MEDIUM] In-flight mute refresh can repopulate old user's mute list after logout

**File:** [`src/core/coordinators/mute-list-sync/mute-list-sync.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/coordinators/mute-list-sync/mute-list-sync.ts#L286-L289) (lines 286, 288, 289)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `other-cross-user-cache`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

refreshMutedUsersFromHomeserver awaits MuteController.fetchMutedUsers(refresh.pubky) before any current-user or generation check. The downstream MuteApplication.fetchMutedUsers persists the fetched mute list into the shared local MUTED stream. Auth cleanup stops future streams and clears IndexedDB, but it cannot cancel an already-started refresh, so user A's refresh can complete after logout/sign-in and write A's mute list into user B's local cache. That can disclose A's mute preferences on a shared browser and make B's UI filter posts with A's mute list. The existing isCurrentPendingRefresh guard only runs after persistence and only protects cursor storage.

## Recommendation

Fence mute refreshes with a coordinator generation/current Pubky check before any local persistence. Split fetch from persist, or pass an AbortSignal/expected user through the application layer so stale refreshes cannot write after stop/logout/account change.

## Revalidation

**Verdict:** true-positive

The coordinator's refresh path still awaits `MuteController.fetchMutedUsers(refresh.pubky)` before it performs `isCurrentPendingRefresh` or any current-user check. The downstream application method fetches the homeserver mute directory and immediately persists the result with `LocalStreamUsersService.upsert({ streamId: UserStreamTypes.MUTED, stream })`, so the stale check happens after the database write. `stop()` and route/auth re-evaluation increment generation, clear timers, and cancel the active stream reader, but they do not abort an already-started `HomeserverService.list` call or prevent its continuation from writing. Auth cleanup clears the database and stores, but that only removes data already present at cleanup time. A concrete race is: user A receives a mute event, the debounced refresh starts, A logs out or B signs in on the same browser, cleanup clears Dexie, and then A's refresh resolves and rewrites the shared `muted` user stream. That stream is not keyed by owner, so B's local UI can read A's mute list and filter posts as if B had muted those users. The post-await `isCurrentPendingRefresh` guard only protects cursor persistence/retry behavior, not the sensitive local persistence itself.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-30)
- V <jovanovicv90@gmail.com> (2026-05-13)
