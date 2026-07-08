/**
 * Image compression configuration applied during upload sanitization
 * (see `src/libs/image/stripImageMetadata.ts`).
 */

/**
 * Maximum length (in pixels) of the longest edge for uploaded raster images on the
 * first encode pass. Images larger than this are downscaled preserving aspect ratio.
 */
export const IMAGE_MAX_DIMENSION = 2048;

/**
 * Hard ceiling for uploaded image bytes on Synonym's homeserver. The moderation
 * service rejects blobs above this size — all image uploads must end up at or
 * below this limit after sanitization/compression.
 */
export const IMAGE_MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/**
 * Longest-edge steps tried when the first encode still exceeds {@link IMAGE_MAX_UPLOAD_SIZE}.
 * The last value (768) is the smallest dimension attempted before giving up.
 */
export const IMAGE_COMPRESSION_DIMENSION_STEPS = [2048, 1536, 1280, 1024, 768];

/**
 * Lossy quality steps (0..1) for JPEG/WebP re-encoding during progressive compression.
 */
export const IMAGE_COMPRESSION_QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52];

/**
 * Default encode quality (0..1) for the first lossy raster pass (JPEG/WebP).
 */
export const IMAGE_ENCODE_QUALITY = 0.82;
