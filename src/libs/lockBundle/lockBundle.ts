// TODO:[Locks] #1998 / Spike #2058 — throwaway prototype, NOT production code.
//
// Pure (environment-agnostic) serialize/deserialize for a locked-content bundle.
// A locked post is packaged into ONE ZIP: `post.json` (manifest) + raw media
// bytes. The Lock Server returns these bytes verbatim, so EVERYTHING here is
// validated client-side on the way back in — there is no backend enforcing the
// shape. Treat every byte from {@link deserializeLockBundle} as hostile until it
// has passed these guards.
import JSZip from 'jszip';
import {
  LOCK_BUNDLE_MANIFEST_MAX_BYTES,
  LOCK_BUNDLE_MANIFEST_PATH,
  LOCK_BUNDLE_MAX_BYTES,
  LOCK_BUNDLE_MEDIA_DIR,
  LOCK_BUNDLE_MEDIA_PATH_RE,
  ZIP_LOCAL_HEADER_MAGIC,
} from './lockBundle.constants';
import { lockBundleManifestSchema } from './lockBundle.schema';
import type {
  DeserializedLockBundle,
  LockBundleAttachment,
  LockBundleInput,
  LockBundleManifest,
} from './lockBundle.types';

type LockBundleErrorCode =
  | 'TOO_LARGE'
  | 'NOT_ZIP'
  | 'CORRUPT_ZIP'
  | 'MISSING_MANIFEST'
  | 'MANIFEST_TOO_LARGE'
  | 'INVALID_MANIFEST_JSON'
  | 'SCHEMA_INVALID'
  | 'UNEXPECTED_ENTRY'
  | 'MISSING_ENTRY'
  | 'SIZE_MISMATCH';

export class LockBundleError extends Error {
  readonly code: LockBundleErrorCode;
  override readonly cause?: unknown;

  constructor(code: LockBundleErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'LockBundleError';
    this.code = code;
    this.cause = cause;
  }
}

/** Reduce an arbitrary filename to the `media/` path charset, keeping it unique by index. */
function toMediaPath(index: number, name: string): string {
  const safe = name.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '') || 'file';
  return `${LOCK_BUNDLE_MEDIA_DIR}/${index}-${safe}`;
}

function hasZipMagic(bytes: Uint8Array): boolean {
  if (bytes.length < ZIP_LOCAL_HEADER_MAGIC.length) return false;
  return ZIP_LOCAL_HEADER_MAGIC.every((b, i) => bytes[i] === b);
}

/**
 * Package a locked post + attachments into a single ZIP blob.
 *
 * Per-entry compression: the manifest is DEFLATE-d (text compresses well);
 * already-compressed media is STORE-d (re-deflating wastes CPU for ~no gain).
 */
/**
 * Build the manifest + raw media entries for a bundle, without zipping. Exposed
 * so a caller can inspect the exact manifest that will be serialized before the
 * ZIP is produced (used by the spike demo to log the pre-zip structure).
 */
export async function buildLockBundleParts(
  input: LockBundleInput,
): Promise<{ manifest: LockBundleManifest; media: Array<{ path: string; bytes: Uint8Array }> }> {
  const media: Array<{ path: string; bytes: Uint8Array }> = [];
  const attachments: LockBundleAttachment[] = [];

  for (let i = 0; i < input.files.length; i++) {
    const file = input.files[i];
    const path = toMediaPath(i, file.name);
    const bytes = new Uint8Array(await file.arrayBuffer());
    media.push({ path, bytes });
    attachments.push({ path, name: file.name, content_type: file.type, size: bytes.byteLength });
  }

  const manifest: LockBundleManifest = {
    post: { content: input.content, kind: input.kind },
    attachments,
  };
  return { manifest, media };
}

export async function serializeLockBundle(input: LockBundleInput): Promise<Uint8Array> {
  const { manifest, media } = await buildLockBundleParts(input);

  // Validate our own manifest before emitting so authoring bugs fail loudly here
  // rather than on a viewer's machine.
  lockBundleManifestSchema.parse(manifest);

  const zip = new JSZip();
  for (const { path, bytes } of media) {
    zip.file(path, bytes, { compression: 'STORE' });
  }
  zip.file(LOCK_BUNDLE_MANIFEST_PATH, JSON.stringify(manifest), { compression: 'DEFLATE' });
  return zip.generateAsync({ type: 'uint8array' });
}

/**
 * Validate + unpack a bundle produced by {@link serializeLockBundle}.
 *
 * Security gauntlet (all client-side — the server validates nothing):
 *  1. total byte ceiling (homeserver blob cap)
 *  2. ZIP magic-byte check before handing bytes to the parser
 *  3. manifest present, size-bounded, valid JSON, strict-schema valid
 *  4. entry allowlist — only the manifest + declared media paths may exist
 *  5. path-traversal guard on every declared path
 *  6. declared size === actual size, and cumulative uncompressed ≤ cap (zip-bomb bound)
 */
export async function deserializeLockBundle(bytes: Uint8Array): Promise<DeserializedLockBundle> {
  if (bytes.byteLength > LOCK_BUNDLE_MAX_BYTES) {
    throw new LockBundleError('TOO_LARGE', 'bundle exceeds the maximum allowed size');
  }
  if (!hasZipMagic(bytes)) {
    throw new LockBundleError('NOT_ZIP', 'bytes are not a ZIP archive');
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch (error) {
    throw new LockBundleError('CORRUPT_ZIP', 'failed to read ZIP archive', error);
  }

  const manifestEntry = zip.file(LOCK_BUNDLE_MANIFEST_PATH);
  if (!manifestEntry) {
    throw new LockBundleError('MISSING_MANIFEST', `missing ${LOCK_BUNDLE_MANIFEST_PATH}`);
  }

  // Read raw bytes first so an oversized (bomb) manifest is caught before decode.
  const manifestBytes = await manifestEntry.async('uint8array');
  if (manifestBytes.byteLength > LOCK_BUNDLE_MANIFEST_MAX_BYTES) {
    throw new LockBundleError('MANIFEST_TOO_LARGE', 'manifest exceeds the maximum allowed size');
  }

  let rawManifest: unknown;
  try {
    rawManifest = JSON.parse(new TextDecoder().decode(manifestBytes));
  } catch (error) {
    throw new LockBundleError('INVALID_MANIFEST_JSON', 'manifest is not valid JSON', error);
  }

  const parsed = lockBundleManifestSchema.safeParse(rawManifest);
  if (!parsed.success) {
    throw new LockBundleError('SCHEMA_INVALID', 'manifest failed schema validation', parsed.error);
  }
  const manifest = parsed.data as LockBundleManifest;

  // Entry allowlist: reject anything the manifest did not declare (extra payloads,
  // traversal entries, hidden files).
  const declaredPaths = new Set<string>([LOCK_BUNDLE_MANIFEST_PATH, ...manifest.attachments.map((a) => a.path)]);
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (!declaredPaths.has(name)) {
      throw new LockBundleError('UNEXPECTED_ENTRY', `undeclared entry: ${name}`);
    }
  }

  let cumulativeBytes = manifestBytes.byteLength;
  const attachments: DeserializedLockBundle['attachments'] = [];

  for (const declared of manifest.attachments) {
    // Schema already enforces the path shape; re-assert traversal safety defensively.
    if (!LOCK_BUNDLE_MEDIA_PATH_RE.test(declared.path) || declared.path.includes('..')) {
      throw new LockBundleError('UNEXPECTED_ENTRY', `unsafe path: ${declared.path}`);
    }

    const entry = zip.file(declared.path);
    if (!entry) {
      throw new LockBundleError('MISSING_ENTRY', `declared entry not found: ${declared.path}`);
    }

    const data = await entry.async('uint8array');
    if (data.byteLength !== declared.size) {
      throw new LockBundleError('SIZE_MISMATCH', `size mismatch for ${declared.path}`);
    }

    cumulativeBytes += data.byteLength;
    if (cumulativeBytes > LOCK_BUNDLE_MAX_BYTES) {
      throw new LockBundleError('TOO_LARGE', 'uncompressed payload exceeds the maximum allowed size');
    }

    attachments.push({ name: declared.name, content_type: declared.content_type, bytes: data });
  }

  return { manifest, attachments };
}
