# [MEDIUM] Malformed animated WebP files fail open with EXIF/XMP metadata intact

**File:** [`src/libs/image/stripImageMetadata.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/libs/image/stripImageMetadata.ts#L236-L701) (lines 236, 257, 272, 697, 701)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `information-disclosure`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

Animated WebP uploads skip canvas re-encoding to preserve animation and rely on stripWebpMetadataChunks() to remove EXIF/XMP chunks. That helper marks the parse unclean for malformed chunks and then returns the original byte array whenever parsing is not clean, even if EXIF/XMP was present. stripImageMetadata() then wraps those original bytes in a new File and uploads them if under the size cap. A crafted animated WebP with metadata followed by a malformed chunk can therefore bypass metadata stripping and publish GPS/XMP data to the homeserver.

## Recommendation

Fail closed when animated WebP parsing is malformed: reject the upload, or only return a rebuilt metadata-free container after a complete successful parse. Add a regression test with EXIF/XMP before a malformed chunk.

## Revalidation

**Verdict:** true-positive

Animated WebP uploads are explicitly excluded from the canvas re-encoding path so animation frames are preserved, and they rely on `stripWebpMetadataChunks()` for EXIF/XMP removal. That helper sets `strippedAny = true` when it encounters `EXIF` or `XMP ` chunks, but if a later chunk has an invalid computed `nextOffset`, it sets `clean = false` and returns the original `bytes` whenever `!clean || !strippedAny`. This means a file with an animation marker before or near the metadata, an EXIF/XMP chunk, and then a malformed chunk will be treated as animated but will fail open to the original container. `stripImageMetadata()` then wraps that returned byte array in a new `File` and only checks whether the output is below `IMAGE_MAX_UPLOAD_SIZE`; it does not reject the malformed parse or verify metadata removal. The upload path in `FileApplication.toFileAttachment()` reads the returned file bytes, normalizes them, and `FileApplication.commitCreate()` uploads the blob to the homeserver, with no later sanitizer. Existing tests cover successful EXIF/XMP stripping and oversized animated WebP rejection, but not the malformed-after-metadata case. A concrete exploit is a crafted under-5MB animated WebP containing GPS EXIF or XMP before a malformed chunk; the app preserves and uploads the original metadata-bearing bytes. The current history includes size-cap and compression work, but no change that makes malformed animated WebP parsing fail closed.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-07-09)
- John R Serrano Perez <john.voiden@gmail.com> (2026-06-25)
