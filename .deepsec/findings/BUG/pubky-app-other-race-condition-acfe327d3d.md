# [BUG] Initial-load unread merge can drop concurrently polled posts

**File:** [`src/core/application/stream/posts/post.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/application/stream/posts/post.ts#L167-L645) (lines 167, 168, 169, 189, 190, 645)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-race-condition`

## Owners

**Suggested assignee:** `85003930+secondl1ght@users.noreply.github.com` _(via last-committer)_

## Finding

prepareStreamForInitialLoad merges the unread stream into the main post stream and then clears the unread stream as separate operations. A coordinator poll can persist new unread items between the merge read and the clear, after which clearUnreadStream deletes those newly written unread IDs. The stale-cache branch similarly clears post and unread streams without a version check. This can silently lose locally cached stream items or unread state during overlapping initial-load and polling flows.

## Recommendation

Make merge-and-clear an atomic LocalStreamPostsService operation that deletes only the unread IDs actually merged, or serialize initial-load preparation and polling per stream. A compare-and-retry or per-stream mutex would also prevent losing concurrently written unread items.

## Revalidation

**Verdict:** true-positive

PostStreamApplication.prepareStreamForInitialLoad still performs merge and clear as separate awaited operations, and the stale-cache path still deletes the main stream and clears the unread stream without a version check. LocalStreamPostsService.mergeUnreadStreamWithPostStream reads the unread row, reads the main row, builds a merged main stream, and upserts it; LocalStreamPostsService.clearUnreadStream then reads and deletes the entire unread row. The StreamCoordinator can independently poll the same stream on home/post/feed routes and calls StreamPostsController.getOrFetchStreamSlice with streamHead > 0, which reaches persistUnreadStreamChunkAndUpdateCounts and writes to the unread stream through persistUnreadNewStreamChunk. There is no per-stream mutex, transaction spanning merge and clear, or delete-only-merged-IDs behavior. A feasible interleaving is: prepare merges unread post A into the main stream, a coordinator poll persists new unread post B, and prepare then clears the unread row containing B; B was not in the merge snapshot and its unread state is lost until a later refetch repairs it. The stale branch has the same shape because a concurrent unread write can land before clearUnreadStream deletes the row. This affects local cached stream/unread state rather than a remote security boundary, but the race is real.

## Recent committers (`git log`)

- secondl1ght <85003930+secondl1ght@users.noreply.github.com> (2026-07-01)
- V <jovanovicv90@gmail.com> (2026-06-30)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-30)
