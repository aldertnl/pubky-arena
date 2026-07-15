# [MEDIUM] Spoofed image MIME type can bypass SVG sanitization before storage

**File:** [`src/core/pipes/file/file.normalizer.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/pipes/file/file.normalizer.ts#L46) (lines 46)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `xss`

## Owners

**Suggested assignee:** `john.voiden@gmail.com` _(via last-committer)_

## Finding

FileNormalizer records the sanitized File metadata by passing file.type into createFile. The upstream sanitizer determines the image kind by trusting file.type before magic bytes, and non-canvas formats such as image/gif keep the original bytes. A crafted File containing active SVG/XML bytes but declared as image/gif can bypass the SVG sanitizer, reach this normalizer, and be stored as an image attachment. If the homeserver/CDN serves or sniffs those bytes as SVG, this becomes stored XSS against viewers.

## Recommendation

Detect magic bytes before trusting file.type or extension. Reject image MIME mismatches, always route SVG signatures through SVG sanitization, and verify signatures for bypass formats such as GIF or animated WebP before passing bytes to FileNormalizer.

## Revalidation

**Verdict:** true-positive

FileNormalizer records the sanitized file metadata by calling createFile(file.name, url, file.type, file.size), so whatever type survives sanitization becomes the stored content_type. FileApplication.toFileAttachment does call stripImageMetadata before this normalizer, but stripImageMetadata.detectImageMimeType first trusts file.type when it starts with image/ and only checks magic bytes if file.type is absent or non-image. A crafted File with SVG/XML bytes but type image/gif is therefore classified as image/gif before the SVG signature detector runs. Because image/gif is not in the canvas sanitization set and is not SVG_MIME_TYPE, stripImageMetadata returns a new File containing the original bytes and type image/gif after only a size check. Those raw bytes are then uploaded via HomeserverService.putBlob, and the file metadata is written with image/gif as content_type. Downstream components treat content_type.startsWith('image') as renderable media and generate CDN image URLs for feed, article, avatar, and visual media paths. The sanitizer bypass and storage of unsanitized active SVG bytes are real and attacker-controllable. I lowered severity because the repo does not prove the final same-origin XSS step: actual script execution depends on Nexus/CDN serving or sniffing behavior and browser handling of those bytes, while the app mostly embeds the result as img/background image.

## Recent committers (`git log`)

- John R Serrano Perez <john.voiden@gmail.com> (2026-05-22)
- V <jovanovicv90@gmail.com> (2026-05-05)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
