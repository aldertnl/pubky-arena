# [BUG] Optimistic post blob URLs can be retained for the whole session

**File:** [`src/core/stores/localFiles/localFiles.store.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/stores/localFiles/localFiles.store.ts#L26-L76) (lines 26, 28, 30, 71, 74, 76)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-resource-leak`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The store keeps post attachment blob URLs under posts[postId] and only revokes them when the same post key is overwritten, explicitly cleared with an empty array, or during the global reset path. A static search found no production caller clearing post attachments after canonical Nexus/CDN metadata is available or after post deletion, while the render path prefers localAttachments when present. In a long session, creating media posts can therefore keep large uploaded files alive in memory and keep local blob previews shadowing canonical attachment metadata until logout. This is not a cross-user security issue, but it is a real resource/stale-preview lifecycle bug.

## Recommendation

Add an explicit post-level cleanup path, such as clearPostAttachments(postId), and call it when a post is deleted and when canonical attachment metadata/CDN URLs are ready. Consider TTL or size caps for optimistic blobs, and revoke every blob URL carried by an attachment, including a distinct urls.feed if one is ever introduced.

## Revalidation

**Verdict:** true-positive

The store still keeps post attachment blob URLs in posts[postId] and revokes only the previous entry for that same post, an explicit empty-array clear, or reset. The type and tests confirm empty-array clearing exists, but a production search found the only non-test post writer is usePostInput setting attachments after successful post creation. No production caller clears a post entry with setPostAttachments(postId, []) after remote attachment metadata is available or after post deletion. PostContentBase passes localAttachments from the store into PostAttachments, and PostAttachments chooses localAttachments over remote attachments whenever the local value is present. The visual feed similarly skips remote attachment metadata lookup when localPostAttachments[postId] has entries, so stale local blobs can shadow canonical file URLs. PostApplication.commitDelete and useDeletePost remove local/homeserver post data but do not clear useLocalFilesStore posts entries. The store also revokes only urls.main, while the AttachmentConstructed type allows a distinct urls.feed, so a future distinct feed blob would not be revoked by the current implementation. This is a real resource and stale-preview lifecycle bug, not a cross-user security issue.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
- secondl1ght <85003930+secondl1ght@users.noreply.github.com> (2026-02-09)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-30)
