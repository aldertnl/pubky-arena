// TODO:[Locks] #1998 / Spike #2058 — throwaway prototype, NOT production code.
import validationLimits from 'pubky-app-specs/validationLimits.json';

/** Manifest entry name inside the ZIP. */
export const LOCK_BUNDLE_MANIFEST_PATH = 'post.json';

/** Directory prefix for raw media entries inside the ZIP. */
export const LOCK_BUNDLE_MEDIA_DIR = 'media';

/**
 * Transport label for the bundle bytes. `application/octet-stream` (paired with
 * `X-Content-Type-Options: nosniff` on the wire) so browsers never auto-interpret
 * the untrusted archive as html/js. The client confirms the ZIP magic itself.
 */
export const LOCK_BUNDLE_CONTENT_TYPE = 'application/octet-stream';

/** ZIP local-file-header magic: `PK\x03\x04`. */
export const ZIP_LOCAL_HEADER_MAGIC = Uint8Array.from([0x50, 0x4b, 0x03, 0x04]);

/** Total bundle byte ceiling — the homeserver blob cap (100 MB). */
export const LOCK_BUNDLE_MAX_BYTES = validationLimits.maxBlobSizeBytes;

/** Hard cap on the (decompressed) manifest, to bound a manifest-side zip bomb. */
export const LOCK_BUNDLE_MANIFEST_MAX_BYTES = 512 * 1024;

/** Max number of media entries in one bundle. Matches the post composer cap. */
export const LOCK_BUNDLE_MAX_ATTACHMENTS = validationLimits.postAttachmentsMaxCount;

/**
 * Allowed media entry path: `media/<safe-name>`. Anchored, no slashes beyond the
 * one prefix and no `..`, so it cannot express path traversal.
 */
export const LOCK_BUNDLE_MEDIA_PATH_RE = /^media\/[A-Za-z0-9._-]+$/;
