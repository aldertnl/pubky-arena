'use client';

import { FileText, Trash2 } from 'lucide-react';
import { Audio } from '@/atoms/Audio/Audio';
import { Button } from '@/atoms/Button/Button';
import { Container } from '@/atoms/Container/Container';
import { Image } from '@/atoms/Image/Image';
import { Typography } from '@/atoms/Typography/Typography';
import { Video } from '@/atoms/Video/Video';
import { cn } from '@/libs/utils/utils';

export type AttachmentPreviewType = 'image' | 'video' | 'audio' | 'pdf';

type AttachmentPreviewItemProps = {
  type: AttachmentPreviewType;
  previewUrl: string;
  label: string;
  removeDataCy: string;
  onRemove: () => void;
  disabled: boolean;
};

export function AttachmentPreviewItem({
  type,
  previewUrl,
  label,
  removeDataCy,
  onRemove,
  disabled,
}: AttachmentPreviewItemProps) {
  return (
    <Container className="relative">
      <Button
        variant="dark"
        size="icon"
        data-cy={removeDataCy}
        onClick={onRemove}
        disabled={disabled}
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
          src={previewUrl}
          alt="Image preview"
          className="h-48 w-full cursor-auto rounded-md bg-black object-contain"
        />
      )}

      {type === 'video' && <Video src={previewUrl} className="h-48 w-full cursor-auto" />}

      {type === 'audio' && <Audio src={previewUrl} className="w-full cursor-auto" />}

      {type === 'pdf' && (
        <Container className="cursor-auto flex-row items-center gap-x-2 rounded-md bg-muted p-4 pr-14">
          <FileText className="size-6 shrink-0" />

          <Typography size="sm" className="font-bold break-all">
            {label}
          </Typography>
        </Container>
      )}
    </Container>
  );
}
