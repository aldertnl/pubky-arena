# [HIGH_BUG] Failed homeserver deletes leave posts tombstoned locally but still published remotely

**File:** [`src/core/controllers/post/post.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/controllers/post/post.ts#L423-L435) (lines 423, 435)
**Project:** pubky-app
**Severity:** HIGH_BUG • **Confidence:** high • **Slug:** `other-local-remote-delete-inconsistency`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

PostController.commitDelete correctly checks that the current user is the author before delegating, but the imported PostApplication.commitDelete path tombstones/deletes the local post via LocalPostService.delete before issuing the HomeserverService DELETE. If the homeserver request then fails because of an expired session, network error, or 5xx response, the error propagates while the local tombstone remains committed. The delete hook intentionally does not restore tombstoned rows, and I found no durable retry queue for these failed deletes. The user can therefore see the post as deleted locally while the original content is still available from the homeserver/Nexus, which is a serious privacy and data-consistency failure for destructive content removal.

## Recommendation

Make post deletion transactional across local and remote state: either perform the homeserver DELETE before committing the local tombstone, roll back the local tombstone when the homeserver DELETE fails, or persist a durable pending-delete job with visible retry/error state so the UI does not imply remote deletion succeeded until it actually has.

## Revalidation

**Verdict:** true-positive

I read `PostController.commitDelete` and it correctly parses the composite id, checks that the current user is the author, and delegates to `PostApplication.commitDelete`. The delegated application path then tombstones local state through `LocalPostService.delete` before the homeserver DELETE. If that remote request fails, the application propagates the error without rollback or durable retry. The UI hook intentionally treats a tombstoned row as a committed local-first write and does not restore the post after the failure. Stream persistence also prevents stale Nexus responses from overwriting tombstones, so the failed delete can remain hidden locally. This means the controller-level mutation can tell the UI deletion failed while leaving the destructive local side effect in place and the remote content still available. This is the same technical root cause as the application finding, but it is in a different target file, so it is not a same-file duplicate under the requested rules.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
- John R Serrano Perez <john.voiden@gmail.com> (2026-06-25)
- Taehwa Kim <hadeath03@gmail.com> (2026-05-07)
