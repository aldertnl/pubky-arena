# [BUG] Save picker can perform local bookmark writes during session restore

**File:** [`src/components/organisms/PostSavePicker/PostSavePicker.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/PostSavePicker/PostSavePicker.tsx#L328) (lines 328)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-session-restore-race`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

`handleOpenChange` opens the save picker via `requireAuth`, which checks persisted `currentUserPubky` rather than requiring a restored live session. On public post routes, the app can render while `sessionExport` exists and `session` is still null. In that window, bookmark toggles can call `BookmarkApplication.persist`, which runs the local IndexedDB write and homeserver request in parallel. If the homeserver write fails because there is no session, the local bookmark row may still have been created or deleted without rollback.

## Recommendation

Require `session` to be present before opening or enabling save mutations, and make bookmark persistence transactional from the caller's perspective by rolling back local writes when homeserver sync fails before the session is restored.

## Revalidation

**Verdict:** true-positive

PostSavePicker still opens through requireAuth in handleOpenChange, and requireAuth treats persisted currentUserPubky as sufficient authentication. During a reload with sessionExport present, RouteGuardProvider starts AuthController.restorePersistedSession but still allows public dynamic routes to render before useAuthStore.session is restored. The save picker composes usePostSaveTargets, which reads currentUserPubky directly and exposes useBookmark.toggle. useBookmark.toggle only checks currentUserPubky, then BookmarkController.commitCreate or commitDelete delegates to BookmarkApplication.persist. BookmarkApplication.persist runs LocalBookmarkService.persist and HomeserverService.request in Promise.all, with no live-session preflight and no compensation if the homeserver side rejects. With session null, HomeserverService.request rejects non-owned pubky writes, but the local Dexie transaction may already have created/deleted the bookmark row and updated local bookmark streams/counts. The UI may show an error because the Promise.all rejects, but the local bookmark state can still diverge from the homeserver. Collection toggles have better rollback through PostApplication.commitEdit, so the strongest confirmed impact is the bookmark path described in the finding.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
