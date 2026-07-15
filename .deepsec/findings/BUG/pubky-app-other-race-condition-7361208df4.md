# [BUG] Post tag deletion mutates a stale snapshot outside the transaction

**File:** [`src/core/services/local/tag/post/tag.post.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/services/local/tag/post/tag.post.ts#L96-L110) (lines 96, 97, 102, 103, 109, 110)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-race-condition`

## Owners

**Suggested assignee:** `hadeath03@gmail.com` _(via last-committer)_

## Finding

delete reads PostTagsModel.findById and mutates a PostTagsModel instance before opening the write transaction. The later transaction writes that precomputed snapshot back to IndexedDB. If another local tag create/delete or Nexus merge updates the same post tags between the initial read and the transaction, this delete path can overwrite those intervening changes and recompute counts from stale data.

## Recommendation

Move the findById, PostTagsModel construction, removeTagger call, save, count update, user count update, and TTL update into the same Dexie read-write transaction, matching the create path's transaction shape.

## Revalidation

**Verdict:** true-positive

`LocalPostTagService.create` performs get-or-create, tag mutation, save, count update, user count update, and TTL update inside one Dexie write transaction. In contrast, `delete` reads `PostTagsModel.findById`, constructs a `PostTagsModel`, and calls `removeTagger` before opening the transaction. The transaction then saves that pre-mutated model with `PostTagsModel.upsert`, which is a full-row `put`, and recomputes post counts from the same stale object. If another local tag create/delete or `mergeTags` update commits between the pre-read and the write transaction, this delete can replace those intervening tag changes. A concrete race is a delete reading a row with one label, another operation adding a second label, and the delete transaction later writing a snapshot that lacks the second label. Two concurrent deletes of the same viewer label can also both pass the pre-transaction relationship check and both decrement `UserCountsModel.tagged`. The viewer DELETE marker only affects later Nexus merge policy; it does not make this delete derive its changes from the latest row inside the transaction. Homeserver writes remain owned-session validated, so the exploitability here is local cache/count corruption.

## Recent committers (`git log`)

- Taehwa Kim <hadeath03@gmail.com> (2026-05-14)
- V <jovanovicv90@gmail.com> (2026-05-05)
- John R Serrano Perez <john.voiden@gmail.com> (2026-03-13)
