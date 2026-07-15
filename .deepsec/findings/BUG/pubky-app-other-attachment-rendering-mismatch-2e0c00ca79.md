# [BUG] Accepted non-renderable attachment types can disappear from the UI

**File:** [`src/hooks/usePostInput/usePostInput.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/hooks/usePostInput/usePostInput.ts#L342-L398) (lines 342, 368, 398)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-attachment-rendering-mismatch`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The hook accepts any MIME type from POST_SUPPORTED_ATTACHMENT_MIME_TYPES and adds valid files to attachments. Tracing the render path shows PostInputAttachments only previews image/video/audio/PDF, and PostAttachmentsGenericFiles filters generic files down to PDFs. Accepted files such as zip, text, JSON, HTML, or other spec MIME types can be uploaded but then have no visible/downloadable representation after posting.

## Recommendation

Either restrict the input allowlist to attachment types the UI actually renders, or update the generic attachment renderer to display and safely download every accepted non-media file type.

## Revalidation

**Verdict:** true-positive

For normal posts, handleFilesAdded accepts every MIME in POST_SUPPORTED_ATTACHMENT_MIME_TYPES, which is getValidMimeTypes() from pubky-app-specs. The current accept string and snapshots include non-media types such as application/javascript, application/json, application/octet-stream, application/xml, application/zip, text/html, text/plain, and text/xml. PostController.commitCreate and FileNormalizer pass accepted File objects through to pubky-app-specs createFile and upload them; there is no later narrowing to UI-renderable types. The composer preview only classifies image, video, audio, and application/pdf, leaving other accepted types without a meaningful preview branch. After posting, PostAttachments classifies non-media files as generic, but PostAttachmentsGenericFiles immediately filters genericFiles down to application/pdf and returns null when there are no PDFs. Its tests explicitly assert that zip, text, json, xml, and octet-stream files are filtered out. A user can therefore attach and upload an accepted zip or text file, but the resulting post provides no visible/downloadable representation for that attachment. This is a real product bug, not a security bypass.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-07-09)
- John R Serrano Perez <john.voiden@gmail.com> (2026-06-25)
