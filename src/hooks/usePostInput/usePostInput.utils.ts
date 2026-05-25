import type { ExistingAttachmentMeta } from './usePostInput.types';

export const isMediaFile = (file: File): boolean => file.type.startsWith('image/') || file.type.startsWith('video/');

export const isMediaExistingAttachment = (attachment: ExistingAttachmentMeta): boolean =>
  attachment.type.length === 0 || attachment.type.startsWith('image/') || attachment.type.startsWith('video/');

export const hasRequiredMediaForEdit = (
  nextExistingAttachments: ExistingAttachmentMeta[],
  nextAttachments: File[],
  editHadMediaAttachments: boolean,
  isArticleEdit: boolean,
): boolean => {
  if (!editHadMediaAttachments) return true;
  // Article edits can only have one banner attachment; allow temporary removal so users can replace it.
  // Submit validation still prevents saving while no media is present.
  if (isArticleEdit) return true;

  const hasExistingMedia = nextExistingAttachments.some(isMediaExistingAttachment);
  const hasNewMedia = nextAttachments.some(isMediaFile);
  return hasExistingMedia || hasNewMedia;
};
