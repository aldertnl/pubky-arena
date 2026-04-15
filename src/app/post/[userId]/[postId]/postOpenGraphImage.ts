import * as Core from '@/core';
import { parseNexusFileUrlsField } from '@/core/services/nexus/file/nexusFileUrls';

/**
 * Resolves `NexusFileDetails` for an attachment URI.
 * Matches by exact `uri` first, then by composite file id (handles subtle URI differences).
 */
export function findFileForAttachmentUri(
  files: Core.NexusFileDetails[],
  attachmentUri: string,
): Core.NexusFileDetails | undefined {
  const direct = files.find((f) => f.uri === attachmentUri);
  if (direct) {
    return direct;
  }

  const wantCid = Core.buildCompositeIdFromPubkyUri({
    uri: attachmentUri,
    domain: Core.CompositeIdDomain.FILES,
  });
  if (!wantCid) {
    return undefined;
  }

  return files.find((f) => {
    const cid = Core.buildCompositeIdFromPubkyUri({
      uri: f.uri,
      domain: Core.CompositeIdDomain.FILES,
    });
    return cid === wantCid;
  });
}

/**
 * Picks a single HTTPS URL for Open Graph from file metadata.
 * Images prefer `main` (quality); video uses `feed` / thumbnails first.
 */
export function pickOpenGraphUrlFromFile(file: Core.NexusFileDetails): string | null {
  const urls = parseNexusFileUrlsField(file.urls);
  const ct = file.content_type.toLowerCase();

  if (ct.startsWith('image/')) {
    const u = urls.main || urls.feed || urls.small;
    return u || null;
  }

  if (ct.startsWith('video/')) {
    const u = urls.feed || urls.main || urls.small;
    return u || null;
  }

  return null;
}

/**
 * Resolves the Open Graph image URL for a post page.
 *
 * - Never uses the generic site `preview.webp`.
 * - If the post has attachments, uses the first image or video (in attachment order);
 *   for video, CDN thumbnail URLs (`feed` / etc.) are used as the preview frame.
 * - Otherwise uses the author's avatar CDN URL (`getAvatarUrl`), which also covers
 *   users without an uploaded profile image (deterministic server-side asset).
 *
 * Facehash is client-only; OG crawlers need an absolute image URL, so the avatar
 * CDN is the server-safe equivalent of the in-app facehash fallback.
 */
export async function resolvePostOpenGraphImage(
  user: Core.NexusUserDetails,
  post: Core.NexusPostDetails,
): Promise<string> {
  const orderedUris = post.attachments?.filter((u): u is string => typeof u === 'string' && u.length > 0) ?? [];

  if (orderedUris.length > 0) {
    try {
      const files = await Core.NexusFileService.fetchFiles(orderedUris);

      for (const uri of orderedUris) {
        const file = findFileForAttachmentUri(files, uri);
        if (!file) continue;
        const ogUrl = pickOpenGraphUrlFromFile(file);
        if (ogUrl) {
          return ogUrl;
        }
      }
    } catch {
      // Fall back to avatar below.
    }
  }

  return Core.FileController.getAvatarUrl(user.id, user.image ?? undefined);
}
