'use client';

import { ChangeEvent, Dispatch, SetStateAction, forwardRef, useLayoutEffect, useState } from 'react';
import * as Atoms from '@/atoms';
import * as Icons from '@/libs/icons';
import * as Utils from '@/libs/utils';
import { ARTICLE_ATTACHMENT_ACCEPT_STRING, POST_ATTACHMENT_ACCEPT_STRING } from '@/config';
import type { ExistingAttachmentMeta } from '@/hooks/usePostInput/usePostInput.types';

type PostInputAttachmentsProps = {
  attachments: File[];
  setAttachments: Dispatch<SetStateAction<File[]>>;
  handleFilesAdded: (files: File[]) => void;
  isSubmitting: boolean;
  isArticle?: boolean;
  handleFileClick?: () => void;
  existingAttachments?: ExistingAttachmentMeta[];
  onRemoveExisting?: (index: number) => void;
  onRemoveAttachment?: (index: number) => void;
  isRemoveExistingDisabled?: (index: number) => boolean;
  isRemoveAttachmentDisabled?: (index: number) => boolean;
};

type AttachmentType = 'image' | 'video' | 'audio' | 'pdf';

type AttachmentWithPreview = {
  file: File;
  type: AttachmentType;
  previewUrl: string;
};

const getAttachmentType = (file: File) => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type === 'application/pdf') return 'pdf';
};

const getAttachmentTypeFromMime = (mimeType: string): AttachmentType => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'pdf';
};

type AttachmentPreviewBlockProps = {
  type: AttachmentType;
  previewUrl: string;
  pdfLabel: string;
  onRemove: () => void;
  removeDisabled: boolean;
  removeDataCy: string;
};

function AttachmentPreviewBlock({
  type,
  previewUrl,
  pdfLabel,
  onRemove,
  removeDisabled,
  removeDataCy,
}: AttachmentPreviewBlockProps) {
  return (
    <Atoms.Container className="relative">
      <Atoms.Button
        variant="dark"
        size="icon"
        data-cy={removeDataCy}
        onClick={onRemove}
        disabled={removeDisabled}
        className={Utils.cn(
          'absolute right-4 z-10 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-100',
          type === 'image' || type === 'video' ? 'top-4 size-12' : 'top-1/2 -translate-y-1/2',
          type === 'audio' && 'size-6',
          type === 'pdf' && 'size-8',
        )}
      >
        <Icons.Trash2 className={Utils.cn(type === 'audio' ? 'size-3' : 'size-4')} />
      </Atoms.Button>

      {type === 'image' && (
        <Atoms.Image
          src={previewUrl}
          alt="Image preview"
          className="h-48 w-full cursor-auto rounded-md bg-black object-contain"
        />
      )}

      {type === 'video' && <Atoms.Video src={previewUrl} className="h-48 w-full cursor-auto" />}

      {type === 'audio' && <Atoms.Audio src={previewUrl} className="w-full cursor-auto" />}

      {type === 'pdf' && (
        <Atoms.Container className="cursor-auto flex-row items-center gap-x-2 rounded-md bg-muted p-4 pr-14">
          <Icons.FileText className="size-6 shrink-0" />

          <Atoms.Typography size="sm" className="font-bold break-all">
            {pdfLabel}
          </Atoms.Typography>
        </Atoms.Container>
      )}
    </Atoms.Container>
  );
}

export const PostInputAttachments = forwardRef<HTMLInputElement, PostInputAttachmentsProps>(
  (
    {
      attachments,
      setAttachments,
      handleFilesAdded,
      isSubmitting,
      isArticle,
      handleFileClick,
      existingAttachments,
      onRemoveExisting,
      onRemoveAttachment,
      isRemoveExistingDisabled,
      isRemoveAttachmentDisabled,
    },
    ref,
  ) => {
    const [attachmentsWithPreviews, setAttachmentsWithPreviews] = useState<AttachmentWithPreview[]>([]);

    useLayoutEffect(() => {
      const previews: AttachmentWithPreview[] = attachments.map((file) => {
        const type = getAttachmentType(file) as AttachmentType;

        return {
          file,
          type,
          previewUrl: URL.createObjectURL(file),
        };
      });
      setAttachmentsWithPreviews(previews);
      return () => {
        previews.forEach((attachment) => {
          URL.revokeObjectURL(attachment.previewUrl);
        });
      };
    }, [attachments]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFilesAdded(files);

      // Reset input so the same file can be selected again
      e.target.value = '';
    };

    const hasExisting = existingAttachments && existingAttachments.length > 0;
    const hasNew = attachmentsWithPreviews.length > 0;

    return (
      <>
        <Atoms.Input
          ref={ref}
          type="file"
          accept={isArticle ? ARTICLE_ATTACHMENT_ACCEPT_STRING : POST_ATTACHMENT_ACCEPT_STRING}
          multiple={!isArticle}
          onChange={handleFileChange}
          className="hidden"
        />

        {isArticle && !attachmentsWithPreviews.length && !hasExisting ? (
          <Atoms.Card className="h-39 w-full cursor-auto items-center justify-center rounded-md">
            <Atoms.CardContent className="flex flex-col items-center justify-center gap-3">
              <Atoms.Container
                overrideDefaults
                className="flex size-16 items-center justify-center rounded-full bg-brand/15"
              >
                <Icons.ImagePlus className="size-8 text-brand" />
              </Atoms.Container>

              <Atoms.Button variant="secondary" size="sm" onClick={handleFileClick} disabled={isSubmitting}>
                <Icons.Plus className="size-4" /> Add image
              </Atoms.Button>
            </Atoms.CardContent>
          </Atoms.Card>
        ) : null}

        {hasExisting || hasNew ? (
          <Atoms.Container className="gap-4">
            {/* Existing attachments (from server) */}
            {existingAttachments?.map((a, i) => (
              <AttachmentPreviewBlock
                key={a.uri}
                type={getAttachmentTypeFromMime(a.type)}
                previewUrl={a.previewUrl}
                pdfLabel={a.name}
                onRemove={() => onRemoveExisting?.(i)}
                removeDisabled={isSubmitting || !!isRemoveExistingDisabled?.(i)}
                removeDataCy={`post-input-attachment-remove-existing-${i}`}
              />
            ))}

            {attachmentsWithPreviews.map((a, i) => (
              <AttachmentPreviewBlock
                key={a.previewUrl}
                type={a.type}
                previewUrl={a.previewUrl}
                pdfLabel={a.file.name}
                onRemove={() => {
                  if (onRemoveAttachment) {
                    onRemoveAttachment(i);
                    return;
                  }
                  setAttachments((prev) => prev.filter((_, index) => index !== i));
                }}
                removeDisabled={isSubmitting || !!isRemoveAttachmentDisabled?.(i)}
                removeDataCy={`post-input-attachment-remove-new-${i}`}
              />
            ))}
          </Atoms.Container>
        ) : null}
      </>
    );
  },
);

PostInputAttachments.displayName = 'PostInputAttachments';
