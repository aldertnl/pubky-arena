import { stripImageMetadata } from '@/libs/image/stripImageMetadata';

/** Files returned by {@link prepareImageForUpload} skip re-sanitization in `FileApplication.toFileAttachment`. */
const preparedUploadFiles = new WeakSet<File>();

/**
 * Returns whether `file` was already sanitized/compressed via {@link prepareImageForUpload}.
 */
export function isPreparedImageUpload(file: File): boolean {
  return preparedUploadFiles.has(file);
}

/**
 * Sanitizes and compresses an image for homeserver upload, then marks it as prepared.
 * Call this when the user picks an image so submit only uploads the final bytes.
 *
 * @param file - Raw image from a file picker or cropper.
 * @returns Prepared file guaranteed to be ≤ {@link IMAGE_MAX_UPLOAD_SIZE} when successful.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  const prepared = await stripImageMetadata(file);
  preparedUploadFiles.add(prepared);
  return prepared;
}
