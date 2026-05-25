'use client';

import { ChangeEvent, Dispatch, forwardRef, SetStateAction, useEffect, useMemo } from 'react';
import { ImagePlus, Plus } from 'lucide-react';
import { Button } from '@/atoms/Button/Button';
import { Card, CardContent } from '@/atoms/Card/Card';
import { Container } from '@/atoms/Container/Container';
import { Input } from '@/atoms/Input/Input';
import { ARTICLE_ATTACHMENT_ACCEPT_STRING, POST_ATTACHMENT_ACCEPT_STRING } from '@/config/posts';
import type { EditAttachmentControls } from '@/hooks/usePostInput/usePostInput.types';
import { AttachmentPreviewItem, type AttachmentPreviewType } from './AttachmentPreviewItem';

type PostInputAttachmentsProps = {
  attachments: File[];
  setAttachments: Dispatch<SetStateAction<File[]>>;
  handleFilesAdded: (files: File[]) => void;
  isSubmitting: boolean;
  isArticle?: boolean;
  handleFileClick?: () => void;
  editAttachmentControls?: EditAttachmentControls;
};
type AttachmentWithPreview = {
  file: File;
  type: AttachmentPreviewType;
  previewUrl: string;
};
const getAttachmentType = (file: File) => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type === 'application/pdf') return 'pdf';
};

const getAttachmentTypeFromMime = (mimeType: string): AttachmentPreviewType => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'pdf';
};

export const PostInputAttachments = forwardRef<HTMLInputElement, PostInputAttachmentsProps>(
  (
    { attachments, setAttachments, handleFilesAdded, isSubmitting, isArticle, handleFileClick, editAttachmentControls },
    ref,
  ) => {
    const attachmentsWithPreviews: AttachmentWithPreview[] = useMemo(
      () =>
        attachments.map((file) => {
          const type = getAttachmentType(file) as AttachmentPreviewType;
          return {
            file,
            type,
            previewUrl: URL.createObjectURL(file),
          };
        }),
      [attachments],
    );

    // Cleanup object URLs when attachments change or component unmounts
    useEffect(() => {
      return () => {
        attachmentsWithPreviews.forEach((attachment) => {
          URL.revokeObjectURL(attachment.previewUrl);
        });
      };
    }, [attachmentsWithPreviews]);
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFilesAdded(files);

      // Reset input so the same file can be selected again
      e.target.value = '';
    };

    const existingAttachments = editAttachmentControls?.existingAttachments;
    const hasExisting = existingAttachments && existingAttachments.length > 0;
    const hasNew = attachmentsWithPreviews.length > 0;

    return (
      <>
        <Input
          ref={ref}
          type="file"
          accept={isArticle ? ARTICLE_ATTACHMENT_ACCEPT_STRING : POST_ATTACHMENT_ACCEPT_STRING}
          multiple={!isArticle}
          onChange={handleFileChange}
          className="hidden"
        />

        {isArticle && !attachmentsWithPreviews.length && !hasExisting ? (
          <Card className="h-39 w-full cursor-auto items-center justify-center rounded-md">
            <CardContent className="flex flex-col items-center justify-center gap-3">
              <Container overrideDefaults className="flex size-16 items-center justify-center rounded-full bg-brand/15">
                <ImagePlus className="size-8 text-brand" />
              </Container>

              <Button variant="secondary" size="sm" onClick={handleFileClick} disabled={isSubmitting}>
                <Plus className="size-4" /> Add image
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {hasExisting || hasNew ? (
          <Container className="gap-4">
            {existingAttachments?.map((a, i) => (
              <AttachmentPreviewItem
                key={a.uri}
                type={getAttachmentTypeFromMime(a.type)}
                previewUrl={a.previewUrl}
                label={a.name}
                removeDataCy={`post-input-attachment-remove-existing-${i}`}
                onRemove={() => editAttachmentControls?.onRemoveExisting(i)}
                disabled={isSubmitting || !!editAttachmentControls?.isRemoveExistingDisabled(i)}
              />
            ))}

            {attachmentsWithPreviews.map((a, i) => (
              <AttachmentPreviewItem
                key={a.previewUrl}
                type={a.type}
                previewUrl={a.previewUrl}
                label={a.file.name}
                removeDataCy={`post-input-attachment-remove-new-${i}`}
                onRemove={() => {
                  if (editAttachmentControls?.onRemoveAttachment) {
                    editAttachmentControls.onRemoveAttachment(i);
                    return;
                  }
                  setAttachments((prev) => prev.filter((_, index) => index !== i));
                }}
                disabled={isSubmitting || !!editAttachmentControls?.isRemoveAttachmentDisabled(i)}
              />
            ))}
          </Container>
        ) : null}
      </>
    );
  },
);
PostInputAttachments.displayName = 'PostInputAttachments';
