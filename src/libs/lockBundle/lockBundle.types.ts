// TODO:[Locks] #1998 / Spike #2058 — throwaway prototype, NOT production code.
// Proves the round-trip: lock-post compose -> FE builds ZIP -> unzip -> render
// from the unzipped data. The Lock Server / homeserver / Nexus stay
// content-agnostic; only the unlocking client interprets these bytes.

import { PubkyAppPostKind } from 'pubky-app-specs';

/**
 * Post kind in its JSON (lowercase) form. Derived from the spec enum, which
 * serializes via serde `rename_all = "lowercase"` — single source of truth, so
 * a new kind in the spec widens this automatically.
 */
export type LockPostKind = Lowercase<keyof typeof PubkyAppPostKind>;

/** One media entry inside the bundle, indexed by its zip-relative path. */
export interface LockBundleAttachment {
  /** zip-relative entry path, e.g. "media/0-photo.jpg". */
  path: string;
  /** Original filename, for display / download. */
  name: string;
  /** MIME type; must be in the pubky-app-spec valid set. */
  content_type: string;
  /** Exact byte length of the stored entry. */
  size: number;
}

/**
 * `post.json` — the manifest. A normal PubkyAppPost-shaped body plus an
 * attachment index whose paths point at the raw media entries in the same ZIP.
 */
export interface LockBundleManifest {
  post: {
    content: string;
    kind: LockPostKind;
  };
  attachments: LockBundleAttachment[];
}

/** Author-side input handed to {@link serializeLockBundle}. */
export interface LockBundleInput {
  content: string;
  kind: LockPostKind;
  files: File[];
}

/** Raw, validated output of {@link deserializeLockBundle} (pre-render). */
export interface DeserializedLockBundle {
  manifest: LockBundleManifest;
  attachments: Array<{ name: string; content_type: string; bytes: Uint8Array }>;
}
