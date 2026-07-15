# [BUG] Tombstoned replies can be re-added to reply streams

**File:** [`src/core/services/local/stream/posts/posts.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/services/local/stream/posts/posts.ts#L311-L350) (lines 311, 322, 327, 347, 350)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-logic-bug`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

persistPosts records parent-to-reply stream entries before it filters out locally tombstoned posts. The tombstone guard prevents the deleted post details/counts/tags from being overwritten, but the earlier postReplies map is still persisted into the parent reply stream. If Nexus later returns a locally deleted reply, that reply ID can be reinserted into post_replies:<parent>, causing deleted reply placeholders or stale entries to reappear in local reply streams.

## Recommendation

Build postReplies only from non-tombstoned posts, or filter the reply stream updates against tombstonedIds before calling persistNewStreamChunk. Also consider filtering deleted IDs at reply-stream read time as defense in depth.

## Revalidation

**Verdict:** true-positive

Inside `persistPosts`, `addReplyToStream` is called for every Nexus post before the tombstone guard is evaluated. The later `tombstonedIds` filtering removes tombstoned IDs from details, counts, relationships, tags, bookmarks, TTL, and moderation batches, but it does not remove those IDs from the already-built `postReplies` map. After the bulk table writes, `persistPosts` iterates `postReplies` and calls `persistNewStreamChunk`, so a tombstoned reply returned by stale Nexus data can be inserted into `post_replies:<parent>`. The application-level `getOrFetchStreamSlice` filters deleted posts for most stream reads, but `useReplyStream` reads `StreamPostsController.getLocalStream` directly and only applies mute filtering. `ReplyWithNested` then renders `PostMain` for that reply ID, and `PostMain` renders the deleted placeholder when the tombstone content is present. A concrete scenario is: a user deletes a reply, the delete path removes it from the parent reply stream and leaves a tombstone, then a stale Nexus fetch persists the reply and re-adds only the stream entry. The existing tombstone guard tests verify that post details are not reanimated, but they do not cover this reply-stream side effect.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-03-27)
