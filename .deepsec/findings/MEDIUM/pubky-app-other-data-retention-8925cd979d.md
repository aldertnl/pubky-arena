# [MEDIUM] File delete fallback can leave uploaded blob bytes accessible

**File:** [`src/core/application/file/file.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/application/file/file.ts#L93-L109) (lines 93, 99, 105, 109)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `other-data-retention`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

`commitDelete` deletes the file metadata first, then looks up local metadata to find the blob `src`. If the local file row is missing, the fallback tries to GET the same metadata URI after it has already been deleted, so it cannot reliably recover `src` and delete the blob. A transient blob-delete failure has a similar retry problem because the metadata is already gone. This can leave raw uploaded bytes on the homeserver after the user deletes the file/post, and anyone who already has the blob URL may still be able to fetch the deleted content.

## Recommendation

Resolve the blob `src` before deleting the file metadata. Prefer: read local metadata, fetch remote metadata if needed, validate the metadata and blob paths belong to the current session, delete the blob, then delete metadata and local state. Treat missing metadata idempotently only after the blob path has been recovered or is known impossible to recover.

## Revalidation

**Verdict:** true-positive

FileApplication.commitDelete currently calls HomeserverService.delete(fileUri) before resolving the blob `src`. Only after metadata deletion does it build a composite file id and attempt LocalFileService.read; if that local row is missing, it calls HomeserverService.request(GET, fileUri) to recover `{ src }`. For an owned file path, HomeserverService.request(GET) uses `session.storage.get` and `assertOk`, so after the preceding delete, the metadata GET is expected to fail once the homeserver has removed the file record. The tests for commitDelete explicitly lock in this sequence, including the fallback path that fetches metadata after deletion and the error path where blob deletion is never reached. A realistic trigger is a user deleting a post/file on a device whose IndexedDB lacks the file metadata row, while the homeserver metadata still existed before deletion. In that case the metadata is removed, `src` cannot be recovered, and HomeserverService.delete(file.src) is never called, leaving the raw blob bytes under the blob URL. The same ordering also makes retry fragile after a blob-delete failure because the metadata path may be gone before the retry can recover `src`.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-07-09)
- John R Serrano Perez <john.voiden@gmail.com> (2026-05-22)
