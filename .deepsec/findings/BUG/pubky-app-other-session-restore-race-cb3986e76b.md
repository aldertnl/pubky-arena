# [BUG] Post mutation menu can open before the live session is restored

**File:** [`src/components/organisms/PostMenuActions/PostMenuActions.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/PostMenuActions/PostMenuActions.tsx#L57) (lines 57)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-session-restore-race`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The menu opens through `requireAuth(() => setOpen(true))`, but `useRequireAuth` treats persisted `currentUserPubky` as authenticated even when `session` is still null during persisted-session restoration. Public dynamic post routes render during that loading state. If a user clicks quickly while restore is pending or retrying, menu actions such as delete, follow, or mute can run without a live homeserver session. Several of those local-first operations mutate IndexedDB before `HomeserverService.request` rejects the non-owned write because there is no session, and delete/follow/mute do not consistently roll back, leaving local state diverged from homeserver state.

## Recommendation

Gate mutation UI on a restored live session, not only `currentUserPubky`; disable/open-auth actions while `sessionExport` restoration is pending or `session` is null. Also add lower-layer guards before local-first mutations so they fail before touching IndexedDB when no live session is available.

## Revalidation

**Verdict:** true-positive

The current HEAD is 1b29a961c0c756c6e7064def7dac3b63f03915df, and the reported code path is still present. PostMenuActions opens via requireAuth(() => setOpen(true)), and useRequireAuth only checks useAuthStore.getState().currentUserPubky, not useAuthStore.session. The auth store persists currentUserPubky and sessionExport, while the live session is not persisted and remains null until AuthController.restorePersistedSession completes. RouteGuardProvider explicitly allows dynamic public routes such as /post/[userId]/[postId] even while useAuthStatus is loading because sessionExport exists but session is null, so this component can render in that window. The menu actions then call hooks that also key off currentUserPubky: follow and mute perform LocalFollowService/LocalMuteService writes before HomeserverService.request, and delete passes the author check then LocalPostService.delete runs before the homeserver DELETE. HomeserverService.request does prevent remote non-owned pubky writes when session is null, so this is not a cross-identity homeserver write vulnerability. It is still a real local-first consistency bug: a fast click during session restoration can leave local follow/mute/delete state changed after the homeserver write is rejected, and delete intentionally does not restore when the local tombstone committed.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-07-02)
