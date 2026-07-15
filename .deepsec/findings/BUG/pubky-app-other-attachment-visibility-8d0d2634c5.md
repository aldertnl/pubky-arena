# [BUG] Allowed attachment MIME types exceed what the UI can render

**File:** [`src/config/posts.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/config/posts.ts#L59-L66) (lines 59, 66)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-attachment-visibility`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

POST_SUPPORTED_ATTACHMENT_MIME_TYPES imports the full pubky-app-specs MIME allowlist and POST_ATTACHMENT_ACCEPT_STRING exposes it to the file picker. Traced consumers show usePostInput validates/uploads against that same broad allowlist, while PostInputAttachments only previews image/video/audio/PDF and PostAttachmentsGenericFiles filters generic files down to application/pdf. The current snapshots confirm the accept string includes non-rendered types such as application/javascript, application/json, application/octet-stream, application/zip, text/html, and text/plain. A user can therefore select and submit an accepted non-PDF generic file that is not previewed properly and is not visible/downloadable from the rendered post.

## Recommendation

Either restrict the exported attachment MIME list to types the UI supports, or update the preview and post-rendering components to display safe download rows for every spec-allowed generic file. Consider excluding active content MIME types unless the serving layer forces download-safe headers.

## Revalidation

**Verdict:** true-positive

src/config/posts.ts exports POST_SUPPORTED_ATTACHMENT_MIME_TYPES directly from pubky-app-specs getValidMimeTypes, and current snapshots show POST_ATTACHMENT_ACCEPT_STRING includes application/javascript, application/json, application/octet-stream, application/zip, text/html, text/plain, text/xml, multipart/form-data, and other generic types. PostInputAttachments uses that accept string for normal post file inputs, so those types are offered to the file picker. usePostInput.handleFilesAdded validates against the same POST_SUPPORTED_ATTACHMENT_MIME_TYPES list and only applies size checks, so an accepted non-PDF generic file is added to attachments. usePost then passes those attachments into PostController.commitCreate; FileApplication.toFileAttachment leaves non-images unchanged after stripImageMetadata returns the original file, and FileApplication.commitCreate uploads both blob and metadata. On rendering, PostAttachments separates image/video/audio from everything else and passes the rest to PostAttachmentsGenericFiles. PostAttachmentsGenericFiles immediately filters genericFiles to application/pdf and returns null when there are no PDFs, so accepted generic files such as ZIP, JSON, HTML, JavaScript, or text do not get a visible download row. The input preview path has the same mismatch: getAttachmentType only recognizes image, video, audio, and PDF, leaving other accepted attachments without a meaningful preview.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
- John R Serrano Perez <john.voiden@gmail.com> (2026-06-25)
- SHAcollision <127778313+SHAcollision@users.noreply.github.com> (2026-02-07)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-01-28)
- secondl1ght <85003930+secondl1ght@users.noreply.github.com> (2026-01-23)
