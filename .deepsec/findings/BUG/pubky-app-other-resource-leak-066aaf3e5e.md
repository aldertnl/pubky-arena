# [BUG] Collection cover uploads can be orphaned when collection create or edit fails

**File:** [`src/core/controllers/post/post.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/controllers/post/post.ts#L252-L363) (lines 252, 255, 268, 281, 334, 337, 357, 363)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-resource-leak`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

Collection cover Files are converted and uploaded with FileApplication.commitCreate inside the controller before the collection post is normalized and before the collection create/edit homeserver write succeeds. Unlike normal post attachments, the uploaded cover attachment is not passed into PostApplication.commitCreate, so the existing rollback path cannot delete it if PostNormalizer.toCollection, PostNormalizer.toEdit, or PostApplication.commitCreate/commitEdit later fails. Repeated failed collection submissions can leave orphaned blob and file metadata records in local storage and on the user's homeserver.

## Recommendation

Validate collection content before uploading the cover where possible, and wrap newly uploaded cover files in rollback cleanup. For creates, pass the cover file attachment through the application commit path so failed post writes delete the uploaded file; for edits, delete only the newly uploaded cover if the edit validation or homeserver write fails.

## Revalidation

**Verdict:** true-positive

In `commitCreateCollection`, a `File` cover is converted and uploaded with `FileApplication.commitCreate` before `PostNormalizer.toCollection` and before `PostApplication.commitCreate`. If normalization or the later post commit fails, the controller has no catch block that calls `FileApplication.commitDelete`. The uploaded cover is also not passed as `fileAttachments` to `PostApplication.commitCreate`, so the application-level file rollback for normal post attachments cannot see it. In `commitEditCollection`, the non-author and collection-load checks happen before upload, which is a useful mitigation, but a new cover is still uploaded before `CollectionPostContent.toJson`, `PostNormalizer.toEdit`, and `PostApplication.commitEdit`. Any failure in those later steps, including a homeserver PUT failure, leaves the newly uploaded cover blob and metadata orphaned. The create/edit hooks catch the controller error and show failure toasts but do not clean up uploaded covers. A concrete scenario is a valid cover upload followed by an expired session during the collection post PUT, leaving the cover on the user's homeserver without a committed collection update.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
- John R Serrano Perez <john.voiden@gmail.com> (2026-06-25)
- Taehwa Kim <hadeath03@gmail.com> (2026-05-07)
