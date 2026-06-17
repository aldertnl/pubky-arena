import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { resolvePostUrl } from '@/pipes/post/post.collectionItemUrl';

const URL_FIELD = 'url';

type AddPostByUrlTranslator = (key: string) => string;

export const addPostByUrlFormSchema = (t: AddPostByUrlTranslator) =>
  z.object({
    [URL_FIELD]: z
      .string()
      .trim()
      .refine((value) => value.length > 0, { message: t('urlRequired') })
      .refine((value) => resolvePostUrl(value) !== null, { message: t('invalidUrl') }),
  });

export type AddPostByUrlFormData = z.infer<ReturnType<typeof addPostByUrlFormSchema>>;

export const addPostByUrlFormDefaults: AddPostByUrlFormData = {
  [URL_FIELD]: '',
};

/**
 * Where a pasted post should be saved. Collections add the post to a specific
 * collection envelope; bookmarks add it to the current user's bookmarks.
 */
export type AddContentTarget =
  | { kind: 'collection'; collectionId: string; collectionName: string }
  | { kind: 'bookmark' };

export type UseAddPostByUrlParams = {
  target: AddContentTarget;
  /** Client callback; `Action` suffix satisfies Next.js serializable props lint. */
  onAddedAction?: (postId: string) => void;
};

export type UseAddPostByUrlResult = {
  form: UseFormReturn<AddPostByUrlFormData>;
  submit: (urlOverride?: string) => Promise<boolean>;
  reset: () => void;
};

/**
 * Shared i18n namespace for the add-content dialog. Bookmarks are a special
 * collection, so they reuse the same dialog copy, error messages, and toasts.
 */
export const ADD_CONTENT_DIALOG_NAMESPACE = 'collections.single.addContentDialog';

/** i18n namespace exposing the localized "Bookmarks" label used in toasts. */
export const BOOKMARKS_NAMESPACE = 'collections.bookmarks';
