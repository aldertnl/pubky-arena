# [HIGH_BUG] Failed homeserver delete leaves local cache tombstoned without rollback or retry

**File:** [`src/core/application/post/post.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/application/post/post.ts#L268-L273) (lines 268, 273)
**Project:** pubky-app
**Severity:** HIGH_BUG • **Confidence:** high • **Slug:** `other-local-remote-divergence`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

commitDelete mutates IndexedDB through LocalPostService.delete before sending the homeserver DELETE. If HomeserverService.request then rejects, the method propagates the error but leaves the local post deleted/tombstoned. The UI path treats that local write as committed and does not restore the item, while the remote post can remain published on the homeserver/Nexus. Because tombstoned rows are treated as deleted locally, the user may be unable to retry from the UI and local state can stay permanently divergent from remote state.

## Recommendation

Wrap the local delete in compensating rollback on homeserver failure, or persist a durable pending-delete queue with automatic retry and visible pending state. Do not finalize the local tombstone as a completed delete unless the remote delete has succeeded or retry tracking exists.

## Revalidation

**Verdict:** true-positive

I read `post.ts` fully and traced `PostApplication.commitDelete`; it loads the local post, calls `LocalPostService.delete`, and only then sends `HomeserverService.request({ method: DELETE })`. `LocalPostService.delete` writes a `[DELETED]` tombstone and removes related local records and stream entries before the remote delete is attempted. There is no catch block around the homeserver delete that restores the original post or records a durable pending-delete job. The delete hook confirms the UI behavior: after a failure, if the row is tombstoned it intentionally does not restore the post to the timeline. `LocalStreamPostsService.persistPosts` has a tombstone guard that prevents Nexus refetches from reanimating the locally deleted post. A network failure, expired session, or homeserver 5xx after the local tombstone therefore leaves the user seeing the post as deleted while the remote post remains published. `HomeserverService` does enforce owned-path writes, so this is not a cross-account delete issue, but it is a real local/remote divergence and privacy bug.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
- Taehwa Kim <hadeath03@gmail.com> (2026-05-14)
