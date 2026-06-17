'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { BookmarkController } from '@/controllers/bookmark/bookmark';
import { PostController } from '@/controllers/post/post';
import { Logger } from '@/libs/logger/logger';
import { isPostDeleted } from '@/libs/utils/utils';
import { useToast } from '@/molecules/Toaster/use-toast';
import { CollectionPostContent } from '@/pipes/post/post.collection';
import { collectionItemsIncludePost, type ResolvedPostUrl, resolvePostUrl } from '@/pipes/post/post.collectionItemUrl';
import { useAuthStore } from '@/stores/auth/auth.store';
import {
  ADD_CONTENT_DIALOG_NAMESPACE,
  type AddPostByUrlFormData,
  addPostByUrlFormDefaults,
  addPostByUrlFormSchema,
  BOOKMARKS_NAMESPACE,
  type UseAddPostByUrlParams,
  type UseAddPostByUrlResult,
} from './useAddPostByUrl.types';

const URL_FIELD = 'url';

export function useAddPostByUrl({ target, onAddedAction }: UseAddPostByUrlParams): UseAddPostByUrlResult {
  const t = useTranslations(ADD_CONTENT_DIALOG_NAMESPACE);
  const tBookmarks = useTranslations(BOOKMARKS_NAMESPACE);
  const tToast = useTranslations('toast');
  const currentUserPubky = useAuthStore((state) => state.currentUserPubky);
  const { toast } = useToast();

  const form = useForm<AddPostByUrlFormData>({
    resolver: zodResolver(addPostByUrlFormSchema(t)),
    defaultValues: addPostByUrlFormDefaults,
    mode: 'onChange',
  });

  const setUrlError = (message: string) => {
    form.setError(URL_FIELD, { type: 'manual', message });
  };

  const resolveCollectionItems = async (collectionId: string): Promise<readonly string[]> => {
    const details = await PostController.getDetails({ compositeId: collectionId });
    const parsed = details ? CollectionPostContent.parse(details.content) : null;
    return parsed?.items ?? [];
  };

  const isAlreadyAdded = async (resolved: ResolvedPostUrl): Promise<boolean> => {
    if (target.kind === 'collection') {
      const items = await resolveCollectionItems(target.collectionId);
      return collectionItemsIncludePost(items, resolved.itemUri);
    }
    return BookmarkController.exists(resolved.compositeId);
  };

  const persist = async (resolved: ResolvedPostUrl, userId: string): Promise<void> => {
    if (target.kind === 'collection') {
      await PostController.commitUpdateCollectionItem({
        collectionId: target.collectionId,
        postId: resolved.compositeId,
        shouldAdd: true,
      });
      return;
    }
    await BookmarkController.commitCreate({ postId: resolved.compositeId, userId });
  };

  const successDescription = (): string =>
    t('addedToast', { name: target.kind === 'collection' ? target.collectionName : tBookmarks('title') });

  const addPostByUrl = async (url: string): Promise<boolean> => {
    if (!currentUserPubky) return false;

    const resolved = resolvePostUrl(url);
    if (!resolved) {
      setUrlError(t('invalidUrl'));
      return false;
    }

    let alreadyAdded: boolean;
    try {
      alreadyAdded = await isAlreadyAdded(resolved);
    } catch (error) {
      Logger.error('[useAddPostByUrl] Failed to check existing items', {
        error,
        targetKind: target.kind,
        url,
      });
      setUrlError(t('saveFailed'));
      toast({
        title: tToast('error'),
        description: t('saveFailed'),
      });
      return false;
    }

    if (alreadyAdded) {
      setUrlError(t(target.kind === 'collection' ? 'duplicateUrl' : 'duplicateBookmark'));
      return false;
    }

    const post = await PostController.getOrFetch({
      compositeId: resolved.compositeId,
      viewerId: currentUserPubky,
    }).catch((error) => {
      Logger.error('[useAddPostByUrl] Failed to resolve post from URL', {
        error,
        targetKind: target.kind,
        url,
      });
      return null;
    });

    if (!post || isPostDeleted(post.content)) {
      setUrlError(t('postNotFound'));
      return false;
    }

    // The post resolved fine but a collection cannot be nested into another
    // collection (or bookmarked) — surface that explicitly instead of "not found".
    if (post.kind === 'collection') {
      setUrlError(t('unsupportedPostType'));
      return false;
    }

    try {
      await persist(resolved, currentUserPubky);
    } catch (error) {
      Logger.error('[useAddPostByUrl] Failed to save post from URL', {
        error,
        targetKind: target.kind,
        compositeId: resolved.compositeId,
        url,
      });
      setUrlError(t('saveFailed'));
      toast({
        title: tToast('error'),
        description: t('saveFailed'),
      });
      return false;
    }

    toast({
      title: tToast('success'),
      description: successDescription(),
    });
    onAddedAction?.(resolved.compositeId);
    return true;
  };

  const submit = async (urlOverride?: string): Promise<boolean> => {
    if (!currentUserPubky) return false;

    if (urlOverride !== undefined) {
      form.setValue(URL_FIELD, urlOverride, { shouldDirty: true });
    }

    let added = false;
    await form.handleSubmit(async (data) => {
      const ok = await addPostByUrl(data[URL_FIELD]);
      if (ok) added = true;
    })();

    return added;
  };

  const reset = () => {
    form.reset(addPostByUrlFormDefaults);
  };

  return {
    form,
    submit,
    reset,
  };
}
