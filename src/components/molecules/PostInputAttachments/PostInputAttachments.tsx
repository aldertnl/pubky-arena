'use client';

import { ChangeEvent, Dispatch, forwardRef, SetStateAction, useEffect, useMemo } from 'react';
import { FileText, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { Audio } from '@/atoms/Audio/Audio';
import { Button } from '@/atoms/Button/Button';
import { Card, CardContent } from '@/atoms/Card/Card';
import { Container } from '@/atoms/Container/Container';
import { Image } from '@/atoms/Image/Image';
import { Input } from '@/atoms/Input/Input';
import { Typography } from '@/atoms/Typography/Typography';
import { Video } from '@/atoms/Video/Video';
import { ARTICLE_ATTACHMENT_ACCEPT_STRING, POST_ATTACHMENT_ACCEPT_STRING } from '@/config/posts';
import type { ExistingAttachmentMeta } from '@/hooks/usePostInput/usePostInput.types';
import { cn } from '@/libs/utils/utils';

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
    const attachmentsWithPreviews: AttachmentWithPreview[] = useMemo(
      () =>
        attachments.map((file) => {
          const type = getAttachmentType(file) as AttachmentType;
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
            {/* Existing attachments (from server) */}
            {existingAttachments?.map((a, i) => {
              const type = getAttachmentTypeFromMime(a.type);
              return (
                <Container key={a.uri} className="relative">
                  <Button
                    variant="dark"
                    size="icon"
                    data-cy={`post-input-attachment-remove-existing-${i}`}
                    onClick={() => onRemoveExisting?.(i)}
                    disabled={isSubmitting || isRemoveExistingDisabled?.(i)}
                    className={cn(
                      'absolute right-4 z-10 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-100',
                      type === 'image' || type === 'video' ? 'top-4 size-12' : 'top-1/2 -translate-y-1/2',
                      type === 'audio' && 'size-6',
                      type === 'pdf' && 'size-8',
                    )}
                  >
                    <Trash2 className={cn(type === 'audio' ? 'size-3' : 'size-4')} />
                  </Button>

                  {type === 'image' && (
                    <Image
                      src={a.previewUrl}
                      alt="Image preview"
                      className="h-48 w-full cursor-auto rounded-md bg-black object-contain"
                    />
                  )}

                  {type === 'video' && <Video src={a.previewUrl} className="h-48 w-full cursor-auto" />}

                  {type === 'audio' && <Audio src={a.previewUrl} className="w-full cursor-auto" />}

                  {type === 'pdf' && (
                    <Container className="cursor-auto flex-row items-center gap-x-2 rounded-md bg-muted p-4 pr-14">
                      <FileText className="size-6 shrink-0" />

                      <Typography size="sm" className="font-bold break-all">
                        {a.name}
                      </Typography>
                    </Container>
                  )}
                </Container>
              );
            })}

            {/* New file attachments */}
            {attachmentsWithPreviews.map((a, i) => (
              <Container key={a.previewUrl} className="relative">
                <Button
                  variant="dark"
                  size="icon"
                  data-cy={`post-input-attachment-remove-new-${i}`}
                  onClick={() => {
                    if (onRemoveAttachment) {
                      onRemoveAttachment(i);
                      return;
                    }
                    setAttachments((prev) => prev.filter((_, index) => index !== i));
                  }}
                  disabled={isSubmitting || isRemoveAttachmentDisabled?.(i)}
                  className={cn(
                    'absolute right-4 z-10 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-100',
                    a.type === 'image' || a.type === 'video' ? 'top-4 size-12' : 'top-1/2 -translate-y-1/2',
                    a.type === 'audio' && 'size-6',
                    a.type === 'pdf' && 'size-8',
                  )}
                >
                  <Trash2 className={cn(a.type === 'audio' ? 'size-3' : 'size-4')} />
                </Button>

                {a.type === 'image' && (
                  <Image
                    src={a.previewUrl}
                    alt="Image preview"
                    className="h-48 w-full cursor-auto rounded-md bg-black object-contain"
                  />
                )}

                {a.type === 'video' && <Video src={a.previewUrl} className="h-48 w-full cursor-auto" />}

                {a.type === 'audio' && <Audio src={a.previewUrl} className="w-full cursor-auto" />}

                {a.type === 'pdf' && (
                  <Container className="cursor-auto flex-row items-center gap-x-2 rounded-md bg-muted p-4 pr-14">
                    <FileText className="size-6 shrink-0" />

                    <Typography size="sm" className="font-bold break-all">
                      {a.file.name}
                    </Typography>
                  </Container>
                )}
              </Container>
            ))}
          </Container>
        ) : null}
      </>
    );
  },
);
PostInputAttachments.displayName = 'PostInputAttachments';
