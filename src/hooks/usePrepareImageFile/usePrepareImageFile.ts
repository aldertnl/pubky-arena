'use client';

import { useTranslations } from 'next-intl';
import { prepareImageForUpload } from '@/libs/image/prepareImageForUpload';
import { IMAGE_EXCEEDS_UPLOAD_SIZE_ERROR } from '@/libs/image/stripImageMetadata';
import { useToast } from '@/molecules/Toaster/use-toast';

type UsePrepareImageFileResult = {
  /**
   * Sanitizes/compresses an image for upload. Returns `null` and shows a toast on failure.
   */
  prepare: (file: File) => Promise<File | null>;
};

/**
 * Wraps {@link prepareImageForUpload} with user-facing error toasts for pick-time flows
 * (post attachments, collection cover, avatar crop).
 */
export function usePrepareImageFile(): UsePrepareImageFileResult {
  const { toast } = useToast();
  const t = useTranslations('post.file');

  const prepare = async (file: File): Promise<File | null> => {
    try {
      return await prepareImageForUpload(file);
    } catch (error) {
      const description =
        error instanceof Error && error.message === IMAGE_EXCEEDS_UPLOAD_SIZE_ERROR
          ? t('compressionFailed')
          : t('preparationFailed');
      toast({ variant: 'error', description });
      return null;
    }
  };

  return { prepare };
}
