# [MEDIUM] In-flight stream poll can repopulate viewer-specific cache after logout

**File:** [`src/core/coordinators/streams/stream.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/coordinators/streams/stream.ts#L468-L485) (lines 468, 483, 485)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `other-cross-user-cache`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

poll continues through resolveStreamHead and StreamPostsController.getOrFetchStreamSlice with no generation or current-user guard after awaits. stopPolling clears the interval and currentStreamId, but it does not cancel already-started polls. Downstream stream persistence stores viewer-specific Nexus data, including bookmark relationships mirrored into the local bookmarks table. If the account changes while a poll is in flight, completion after cleanup can repopulate the shared Dexie cache with the prior viewer's bookmarks/relationships and affect the next user's feed state.

## Recommendation

Add an active poll epoch/current-user snapshot and check it before every persistence step, pass AbortSignal to Nexus fetches, and avoid writing viewer-specific stream/bookmark data when the coordinator has stopped or the Pubky changed.

## Revalidation

**Verdict:** true-positive

The stream coordinator's `poll()` captures the stream id, awaits `resolveStreamHead`, and then calls `StreamPostsController.getOrFetchStreamSlice` without checking whether the coordinator is still active or whether the authenticated Pubky changed. The base coordinator stop path clears future intervals only; it does not abort an already-running poll, and `StreamCoordinator.stopPolling` only clears `currentStreamId`. Downstream, the stream controller reads `currentUserPubky` as `viewerId` and the application passes that viewer id to Nexus stream and by-id fetches. The application can persist unread stream chunks when `streamHead > 0`, and `fetchMissingPostsFromNexus` persists returned posts and related data after the Nexus request completes. `LocalStreamPostsService.persistPosts` explicitly mirrors Nexus `post.bookmark` into the local `bookmarks` table, which is viewer-derived state. A concrete race is: user A's poll starts and sends Nexus work with A as viewer, auth cleanup clears local state, then the old poll resumes and writes unread stream entries, post relationships, and A bookmark rows into the shared Dexie database. There is no generation/current-user fence around those persistence steps, so the next account can inherit viewer-specific feed/bookmark state from the old poll.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-30)
- V <jovanovicv90@gmail.com> (2026-05-05)
- secondl1ght <85003930+secondl1ght@users.noreply.github.com> (2026-03-02)
