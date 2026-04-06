import * as Core from '@/core';

import type { ExistingAttachmentMeta } from './usePostInput.types';

/** Image/video media, or unknown MIME (empty) — treat as possibly media for edit guards. */
export function isMediaOrUnknownAttachment(attachment: ExistingAttachmentMeta): boolean {
  return attachment.type.length === 0 || attachment.type.startsWith('image/') || attachment.type.startsWith('video/');
}

/** Preview URL from pubky file URI when local metadata is missing (e.g. not in Dexie). */
export function buildExistingAttachmentMetaWithoutMetadata(uri: string): ExistingAttachmentMeta {
  const compositeId = Core.buildCompositeIdFromPubkyUri({
    uri,
    domain: Core.CompositeIdDomain.FILES,
  });
  const previewUrl = compositeId
    ? Core.FileController.getFileUrl({ fileId: compositeId, variant: Core.FileVariant.MAIN })
    : '';
  return { uri, name: '', type: '', previewUrl };
}
