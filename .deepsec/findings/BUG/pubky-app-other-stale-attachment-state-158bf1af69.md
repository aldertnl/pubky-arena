# [BUG] Attachment state is not cleared or sequenced across prop changes

**File:** [`src/components/organisms/PostAttachments/PostAttachments.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/PostAttachments/PostAttachments.tsx#L21-L95) (lines 21, 23, 26, 63, 74, 75, 95)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-stale-attachment-state`

## Owners

**Suggested assignee:** `john.voiden@gmail.com` _(via last-committer)_

## Finding

The effect starts an async FileController.getMetadata call and updates attachment state when it resolves, but it has no cancellation or request-id guard. It also returns early when attachments or localAttachments are empty without clearing the existing imagesAndVideos, audios, or genericFiles arrays. A rerender from a post with attachments to one without attachments can leave the old media visible, and rapid attachment changes can let an older metadata response overwrite newer state.

## Recommendation

Clear all attachment buckets when the active source has no attachments, and add a cancelled flag or monotonically increasing request id so stale async metadata responses cannot update state after props change.

## Revalidation

**Verdict:** true-positive

PostAttachments keeps separate imagesAndVideos, audios, and genericFiles state arrays and only overwrites them after a successful construction path. In constructAttachments, a null or empty attachments prop returns before clearing those arrays. In constructLocalAttachments, a null or empty localAttachments prop also returns before clearing; because an empty array is truthy, localAttachments=[] selects the local path and then exits with stale state intact. The remote metadata path awaits FileController.getMetadata, which resolves through FileApplication.getMetadata and Dexie-backed LocalFileService.findByIds, so it is an asynchronous boundary even though it is local-only. There is no cancelled flag, request id, or cleanup in the effect, so an older metadata lookup can resolve after props have changed and overwrite newer attachment state. A concrete UI trigger is a post or local upload preview changing from attachments to no attachments, or rapidly changing attachment lists while an older Dexie metadata read is still pending. The component will continue rendering the old media buckets because the render guard only checks the stale state arrays. This is a real UI/data consistency bug, but it does not create a security boundary bypass.

## Recent committers (`git log`)

- John R Serrano Perez <john.voiden@gmail.com> (2026-06-15)
- V <jovanovicv90@gmail.com> (2026-05-05)
- Miguel Medeiros <miguel@miguelmedeiros.com.br> (2026-03-27)
