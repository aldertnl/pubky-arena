// TODO:[Locks] #1998 / Spike #2058 — throwaway prototype, NOT production code.
import { getValidMimeTypes, PubkyAppPostKind } from 'pubky-app-specs';
import validationLimits from 'pubky-app-specs/validationLimits.json';
import { z } from 'zod';
import { LOCK_BUNDLE_MAX_ATTACHMENTS, LOCK_BUNDLE_MEDIA_PATH_RE } from './lockBundle.constants';
import type { LockPostKind } from './lockBundle.types';

const VALID_MIME_TYPES = new Set(getValidMimeTypes() as string[]);

// Derive the kind values from the spec enum (drops the numeric reverse-map keys)
// so the schema stays in lockstep with pubky-app-specs.
const POST_KIND_VALUES = Object.keys(PubkyAppPostKind)
  .filter((key) => Number.isNaN(Number(key)))
  .map((key) => key.toLowerCase()) as [LockPostKind, ...LockPostKind[]];

const kindSchema = z.enum(POST_KIND_VALUES);

const attachmentSchema = z.strictObject({
  path: z.string().regex(LOCK_BUNDLE_MEDIA_PATH_RE, 'invalid media path'),
  name: z.string().min(validationLimits.fileNameMinLength).max(validationLimits.fileNameMaxLength),
  content_type: z.string().refine((t) => VALID_MIME_TYPES.has(t), 'unsupported MIME type'),
  size: z.number().int().positive(),
});

/**
 * Strict manifest schema. Unknown keys are rejected (`strictObject`) so a
 * tampered bundle from the content-agnostic server cannot smuggle extra fields.
 */
export const lockBundleManifestSchema = z.strictObject({
  post: z.strictObject({
    content: z.string().max(validationLimits.postLongContentMaxLength),
    kind: kindSchema,
  }),
  attachments: z.array(attachmentSchema).max(LOCK_BUNDLE_MAX_ATTACHMENTS),
});
