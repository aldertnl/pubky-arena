# [BUG] Uploaded attachments are not rolled back when local post creation fails

**File:** [`src/core/application/post/post.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/application/post/post.ts#L221-L224) (lines 221, 224)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-orphaned-upload`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

commitCreate uploads file attachments before LocalPostService.create, but the rollback logic only covers failures from the later homeserver post PUT. If the local post write fails after FileApplication.commitCreate succeeds, the uploaded file metadata/blob remains on the homeserver even though post creation failed.

## Recommendation

Track uploaded file URIs and delete them in a catch block that covers every failure after FileApplication.commitCreate, including LocalPostService.create failures.

## Revalidation

**Verdict:** true-positive

In `PostApplication.commitCreate`, file attachments are uploaded with `FileApplication.commitCreate` before `LocalPostService.create` runs. The only rollback catch starts after the local create, around the homeserver post PUT. If `LocalPostService.create` fails, the exception propagates directly and the uploaded file URIs are never passed to `FileApplication.commitDelete`. `FileApplication.commitCreate` writes the blob bytes, writes file metadata to the homeserver, and then persists local file state, so a successful upload has external side effects before the post exists. The post application tests cover local-save failure and only assert that the homeserver post PUT is skipped; there is no file rollback assertion for that path. A concrete failure is an IndexedDB transaction/quota error after attachment upload, leaving blob and file metadata records on the homeserver without any post referencing them. The existing rollback for homeserver PUT failure does not cover this earlier failure point.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
- Taehwa Kim <hadeath03@gmail.com> (2026-05-14)
