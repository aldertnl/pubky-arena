'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileController } from '@/controllers/file/file';
import { Logger } from '@/libs/logger/logger';
import { CompositeIdDomain } from '@/models/models.types';
import { buildCompositeIdFromPubkyUri } from '@/models/models.utils';
import type { PostDetailsModel } from '@/models/post/details/postDetails';
import { useToast } from '@/molecules/Toaster/use-toast';
import { FileVariant } from '@/services/nexus/file/file.types';
import type { ArticleJSON } from './usePostArticle.types';

interface CoverImage {
  src: string;
  alt: string;
}

interface UsePostArticleParams {
  content: string;
  attachments: PostDetailsModel['attachments'];
  coverImageVariant: FileVariant;
}

interface UsePostArticleResult {
  title: string;
  body: string;
  coverImage: CoverImage | null;
}

/**
 * Custom hook to extract article data from post content and attachments
 *
 * @param params.content - The JSON stringified article content containing title and body
 * @param params.attachments - The file attachment URIs for the post
 * @param params.coverImageVariant - The variant to use when generating the cover image URL
 * @returns Object containing title, body, and coverImage
 *
 * @example
 * ```tsx
 * const { title, body, coverImage } = usePostArticle({
 *   content: '{"title":"My Article","body":"Article content..."}',
 *   attachments: ['pubky://user/pub/pubky.app/files/file-123'],
 *   coverImageVariant: FileVariant.FEED,
 * });
 * ```
 */
export function usePostArticle({
  content,
  attachments,
  coverImageVariant,
}: UsePostArticleParams): UsePostArticleResult {
  const { toast } = useToast();
  const tToast = useTranslations('toast');
  const tPost = useTranslations('toast.post');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [coverImage, setCoverImage] = useState<CoverImage | null>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(content) as ArticleJSON;
      setTitle(parsed.title || '');
      setBody(parsed.body || '');
    } catch {
      toast({
        title: tToast('error'),
        description: tPost('parseError'),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast is an external side-effect, not a dependency
  }, [content]);

  useEffect(() => {
    let cancelled = false;

    const resolveCoverImageFromUri = (attachmentUri: string): CoverImage | null => {
      const compositeId = buildCompositeIdFromPubkyUri({
        uri: attachmentUri,
        domain: CompositeIdDomain.FILES,
      });

      if (!compositeId) {
        Logger.error('[usePostArticle] Failed to parse cover image URI', { attachmentUri });
        return null;
      }

      try {
        const src = FileController.getFileUrl({ fileId: compositeId, variant: coverImageVariant });
        return { src, alt: 'Article cover image' };
      } catch (error) {
        Logger.error('[usePostArticle] Failed to build cover image URL', {
          attachmentUri,
          coverImageVariant,
          error,
        });
        return null;
      }
    };

    const extractCoverImage = async () => {
      setCoverImage(null);

      if (!attachments?.length) return;

      try {
        const attachmentMetadata = await FileController.getMetadata({ fileAttachments: attachments });

        if (cancelled) return;

        const metadataByUri = new Map(attachmentMetadata.map((metadata) => [metadata.uri, metadata]));
        const firstImageAttachment = attachments
          .map((uri) => metadataByUri.get(uri))
          .find((metadata) => metadata?.content_type.startsWith('image'));

        if (firstImageAttachment) {
          const src = FileController.getFileUrl({ fileId: firstImageAttachment.id, variant: coverImageVariant });
          setCoverImage({ src, alt: firstImageAttachment.name });
          return;
        }

        if (attachmentMetadata.length > 0) {
          Logger.warn('[usePostArticle] Cover image metadata is present but not an image', {
            attachments,
          });
          return;
        }

        const fallbackCoverImage = resolveCoverImageFromUri(attachments[0]);
        if (fallbackCoverImage) {
          Logger.warn('[usePostArticle] Cover image metadata unavailable, using URI fallback', {
            attachmentUri: attachments[0],
          });
          setCoverImage(fallbackCoverImage);
          return;
        }

        toast({
          title: tToast('error'),
          description: tPost('coverImageError'),
        });
        Logger.error('[usePostArticle] Failed to resolve cover image from metadata and URI fallback', {
          attachments,
        });
      } catch (error) {
        if (cancelled) return;

        const fallbackCoverImage = resolveCoverImageFromUri(attachments[0]);
        if (fallbackCoverImage) {
          Logger.warn('[usePostArticle] Failed to read cover metadata, using URI fallback', {
            attachmentUri: attachments[0],
            error,
          });
          setCoverImage(fallbackCoverImage);
          return;
        }

        toast({
          title: tToast('error'),
          description: tPost('coverImageError'),
        });
        Logger.error('[usePostArticle] Failed to load article cover image', {
          attachments,
          error,
        });
      }
    };

    extractCoverImage();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast is an external side-effect, not a dependency
  }, [attachments, coverImageVariant]);

  return {
    title,
    body,
    coverImage,
  };
}
