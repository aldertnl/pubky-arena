# [BUG] Concurrent hard deletes can decrement local author counts more than once

**File:** [`src/core/services/local/post/post.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/services/local/post/post.ts#L324-L415) (lines 324, 331, 348, 411, 415)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-race-condition`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

LocalPostService.delete checks whether the post is already tombstoned before opening the Dexie transaction, then later decrements the author's local post count inside the transaction. Two concurrent delete calls for the same unlinked post can both observe the live post at the pre-transaction check, both enter the hard-delete path, and both decrement UserCountsModel. This is not a remote authorization bypass because controller and homeserver ownership checks protect actual deletes, but it can corrupt the local cache/counts on repeated or overlapping delete flows.

## Recommendation

Move the tombstone/idempotency check and linked-count decision into the same Dexie rw transaction that performs the delete and count update. Re-read the post inside the transaction and no-op if it is already tombstoned.

## Revalidation

**Verdict:** true-positive

`LocalPostService.delete` performs the tombstone idempotency check before opening its Dexie write transaction. It also reads post counts, relationships, and details before the transaction, then the hard-delete transaction uses those captured values and always calls `UserCountsModel.updateCounts` with `posts: -1`. The sequential repeated-delete case is partially covered by the current tombstone guard and test, but two concurrent delete calls can both observe live content before either transaction writes `DELETED`. Dexie may serialize the write transactions, but the second transaction does not re-read the post inside the transaction after the first one has tombstoned it. As a result, the second transaction can update the tombstone again and decrement the already-decremented user count. `UserCountsModel.updateCounts` reads the current count inside each transaction, so the second call can move the count from N-1 to N-2. `PostController.commitDelete` still enforces authorship and `HomeserverService` enforces owned-session writes, so this is local cache/count corruption rather than a cross-user remote delete.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
- secondl1ght <85003930+secondl1ght@users.noreply.github.com> (2026-03-15)
