# [BUG] User tag delete can lose concurrent local updates

**File:** [`src/core/services/local/tag/user/tag.user.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/services/local/tag/user/tag.user.ts#L56-L73) (lines 56, 61, 67, 69, 70, 71, 72, 73)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-race-condition`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

LocalUserTagService.delete reads the tag row and mutates the UserTagsModel before opening the Dexie write transaction. The transaction then saves that pre-mutated snapshot and updates counts. If another local tag create/delete for the same tagged user interleaves between the pre-transaction read and the write transaction, the later save can overwrite the other update or double-decrement counts. This is not a cross-user homeserver write issue because the downstream HomeserverService still rejects non-owned writes, but it can corrupt the local IndexedDB cache until the data is refreshed from Nexus.

## Recommendation

Move the findById/getOrCreate, removeTagger, idempotency decision, save, and count updates into the same Dexie transaction, or use an atomic modify path that derives changes from the latest row state inside the transaction.

## Revalidation

**Verdict:** true-positive

`LocalUserTagService.delete` reads `UserTagsModel.findById` and mutates the returned model before it opens the Dexie write transaction. The transaction saves the whole pre-mutated tag collection with `UserTagsModel.upsert` and applies count deltas based on `lastTaggerOnTag`, which was also computed before the transaction. Because `upsert` is a full-row `put`, any create/delete for the same tagged user that commits between the read and the transaction can be overwritten by the stale snapshot. Concurrent duplicate deletes can also both observe that the viewer has the tag and both decrement tagger/tagged counts even though only one logical deletion happened. The create path avoids this by doing `getOrCreate`, mutation, save, and count updates inside a single transaction, which highlights the asymmetry in delete. Normal hooks pass the current viewer as `taggerId`, and remote writes still go through `HomeserverService.request` owned-session checks, so this is not a cross-identity homeserver write issue. It remains a real local IndexedDB race because the delete transaction never re-reads the current tag row before saving.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- John R Serrano Perez <john.voiden@gmail.com> (2026-03-13)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
