# [BUG] Concurrent stream chunk writes can lose cached post IDs

**File:** [`src/core/services/local/stream/posts/posts.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/services/local/stream/posts/posts.ts#L373-L420) (lines 373, 374, 387, 397, 410, 411, 419, 420)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-race-condition`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

persistNewStreamChunk and persistUnreadNewStreamChunk both read the current stream, merge a new array in memory, then replace the whole stream record with upsert. If two fetches or polling cycles for the same stream overlap, both can read the same prior value and the later upsert can discard post IDs merged by the earlier one. The base coordinator polling model can start a new poll without awaiting the previous poll, making this a plausible local cache consistency issue.

## Recommendation

Use an atomic Dexie modify/update helper for stream item merges, or wrap the read-merge-write in a per-stream transaction/mutex with retry. Prefer the existing model-level item modification helpers where they preserve the desired ordering semantics.

## Revalidation

**Verdict:** true-positive

`persistNewStreamChunk` reads the existing stream with `PostStreamModel.findById`, merges the incoming IDs in memory, optionally sorts, then replaces the whole stream with `PostStreamModel.upsert`. `persistUnreadNewStreamChunk` uses the same read-merge-replace shape for unread streams. The shared `BaseStreamModel` has atomic `prependItems` and `removeItems` helpers using Dexie `modify`, but these chunk persistence methods do not use them. Two overlapping calls for the same stream with disjoint chunks can both read the same old stream and compute old-plus-A and old-plus-B independently. Whichever `upsert` finishes last replaces the entire row and can discard the IDs written by the earlier call. This overlap is plausible in the current app because the base polling coordinator launches both immediate and interval polls with `void this.poll()` and has no in-flight guard. The impact is local stream cache loss or stale pagination state, not remote privilege escalation, and there is no transaction, mutex, retry, or atomic modify path in the current implementation.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-03-27)
