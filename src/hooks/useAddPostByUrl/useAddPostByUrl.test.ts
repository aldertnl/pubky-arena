import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAddPostByUrl } from './useAddPostByUrl';
import type { AddContentTarget } from './useAddPostByUrl.types';

const mocks = vi.hoisted(() => ({
  getDetails: vi.fn(),
  getOrFetch: vi.fn(),
  commitUpdateCollectionItem: vi.fn(),
  bookmarkExists: vi.fn(),
  bookmarkCommitCreate: vi.fn(),
  toast: vi.fn(),
  loggerError: vi.fn(),
}));

const AUTHOR_PUBKY = 'o1gg96ewuojmopcjbz8895478wdtxtzzber7aezq6ror5a91j7dy';
const CURRENT_USER_PUBKY = 'r1gg96ewuojmopcjbz8895478wdtxtzzber7aezq6ror5a91j7dz';
const POST_ID = '0034BBBDFK83G';
const POST_URL = `https://app.pubky.org/post/${AUTHOR_PUBKY}/${POST_ID}`;
const POST_URI = `pubky://${AUTHOR_PUBKY}/pub/pubky.app/posts/${POST_ID}`;
const POST_COMPOSITE_ID = `${AUTHOR_PUBKY}:${POST_ID}`;
const COLLECTION_ID = `${CURRENT_USER_PUBKY}:collection123`;
const COLLECTION_NAME = 'Proof of Work';
const URL_FIELD = 'url';

const toastStrings: Record<string, string> = { success: 'Success', error: 'Error' };

const collectionStrings: Record<string, string> = {
  urlRequired: 'Paste a post URL.',
  invalidUrl: 'Enter a valid Pubky post URL.',
  duplicateUrl: 'This post is already in the collection.',
  duplicateBookmark: 'This post is already bookmarked.',
  postNotFound: 'Post not found.',
  unsupportedPostType: "Collections can't be added here.",
  saveFailed: 'Failed to add post.',
  addedToast: 'Added to {name}',
};

const bookmarksLabelStrings: Record<string, string> = { title: 'Bookmarks' };

const createCollectionDetails = (items: string[] = []) => ({
  id: COLLECTION_ID,
  content: JSON.stringify({ name: COLLECTION_NAME, description: '', items }),
  kind: 'collection',
});

vi.mock('@/controllers/post/post', () => ({
  PostController: {
    getDetails: (...args: unknown[]) => mocks.getDetails(...args),
    getOrFetch: (...args: unknown[]) => mocks.getOrFetch(...args),
    commitUpdateCollectionItem: (...args: unknown[]) => mocks.commitUpdateCollectionItem(...args),
  },
}));

vi.mock('@/controllers/bookmark/bookmark', () => ({
  BookmarkController: {
    exists: (...args: unknown[]) => mocks.bookmarkExists(...args),
    commitCreate: (...args: unknown[]) => mocks.bookmarkCommitCreate(...args),
  },
}));

vi.mock('@/molecules/Toaster/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

let mockCurrentUserPubky: string | undefined;
vi.mock('@/stores/auth/auth.store', () => ({
  useAuthStore: (selector: (state: { currentUserPubky: string | undefined }) => unknown) =>
    selector({ currentUserPubky: mockCurrentUserPubky }),
}));

vi.mock('@/libs/logger/logger', async () => {
  const actual = await vi.importActual<typeof import('@/libs/logger/logger')>('@/libs/logger/logger');
  return {
    ...actual,
    Logger: {
      ...actual.Logger,
      error: (...args: unknown[]) => mocks.loggerError(...args),
    },
  };
});

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, values?: Record<string, string>) => {
    const dict =
      namespace === 'collections.single.addContentDialog'
        ? collectionStrings
        : namespace === 'collections.bookmarks'
          ? bookmarksLabelStrings
          : toastStrings;
    return Object.entries(values ?? {}).reduce(
      (message, [name, value]) => message.replace(`{${name}}`, value),
      dict[key] ?? key,
    );
  },
}));

function renderAddHook(target: AddContentTarget) {
  const onAddedAction = vi.fn();
  const rendered = renderHook(() => useAddPostByUrl({ target, onAddedAction }));

  return { ...rendered, onAddedAction };
}

async function submitUrl(result: ReturnType<typeof renderAddHook>['result'], url: string) {
  await act(async () => {
    result.current.form.setValue(URL_FIELD, url);
  });

  let submitted = false;
  await act(async () => {
    submitted = await result.current.submit();
  });

  return submitted;
}

const collectionTarget: AddContentTarget = {
  kind: 'collection',
  collectionId: COLLECTION_ID,
  collectionName: COLLECTION_NAME,
};

const bookmarkTarget: AddContentTarget = { kind: 'bookmark' };

describe('useAddPostByUrl - collection target', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUserPubky = CURRENT_USER_PUBKY;
    mocks.getDetails.mockResolvedValue(createCollectionDetails());
    mocks.getOrFetch.mockResolvedValue({
      id: POST_COMPOSITE_ID,
      kind: 'short',
      content: 'Hello Pubky',
    });
    mocks.commitUpdateCollectionItem.mockResolvedValue(undefined);
  });

  it('fetches the pasted post and adds it to the collection', async () => {
    const { result, onAddedAction } = renderAddHook(collectionTarget);

    const submitted = await submitUrl(result, POST_URL);

    expect(submitted).toBe(true);
    expect(mocks.getDetails).toHaveBeenCalledWith({ compositeId: COLLECTION_ID });
    expect(mocks.getOrFetch).toHaveBeenCalledWith({
      compositeId: POST_COMPOSITE_ID,
      viewerId: CURRENT_USER_PUBKY,
    });
    expect(mocks.commitUpdateCollectionItem).toHaveBeenCalledWith({
      collectionId: COLLECTION_ID,
      postId: POST_COMPOSITE_ID,
      shouldAdd: true,
    });
    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Added to Proof of Work',
    });
    expect(onAddedAction).toHaveBeenCalledWith(POST_COMPOSITE_ID);
  });

  it('adds a pasted clipboard URL without requiring a second submit', async () => {
    const { result, onAddedAction } = renderAddHook(collectionTarget);

    let submitted = false;
    await act(async () => {
      submitted = await result.current.submit(POST_URL);
    });

    expect(submitted).toBe(true);
    expect(mocks.commitUpdateCollectionItem).toHaveBeenCalledWith({
      collectionId: COLLECTION_ID,
      postId: POST_COMPOSITE_ID,
      shouldAdd: true,
    });
    expect(onAddedAction).toHaveBeenCalledWith(POST_COMPOSITE_ID);
  });

  it('shows an inline error for invalid URLs without fetching or saving', async () => {
    const { result } = renderAddHook(collectionTarget);

    const submitted = await submitUrl(result, 'https://app.pubky.org/profile/not-a-post');

    expect(submitted).toBe(false);
    await waitFor(() => {
      expect(result.current.form.getFieldState(URL_FIELD).error?.message).toBe('Enter a valid Pubky post URL.');
    });
    expect(mocks.getOrFetch).not.toHaveBeenCalled();
    expect(mocks.commitUpdateCollectionItem).not.toHaveBeenCalled();
  });

  it('shows an inline error when the post is already in the collection', async () => {
    mocks.getDetails.mockResolvedValue(createCollectionDetails([POST_URI]));
    const { result } = renderAddHook(collectionTarget);

    const submitted = await submitUrl(result, POST_URL);

    expect(submitted).toBe(false);
    expect(result.current.form.getFieldState(URL_FIELD).error?.message).toBe('This post is already in the collection.');
    expect(mocks.getOrFetch).not.toHaveBeenCalled();
    expect(mocks.commitUpdateCollectionItem).not.toHaveBeenCalled();
  });

  it('shows an inline error when the post cannot be resolved', async () => {
    mocks.getOrFetch.mockResolvedValueOnce(null);
    const { result } = renderAddHook(collectionTarget);

    const submitted = await submitUrl(result, POST_URL);

    expect(submitted).toBe(false);
    expect(result.current.form.getFieldState(URL_FIELD).error?.message).toBe('Post not found.');
    expect(mocks.commitUpdateCollectionItem).not.toHaveBeenCalled();
  });

  it('rejects collection post URLs as unsupported content targets', async () => {
    mocks.getOrFetch.mockResolvedValueOnce({
      id: POST_COMPOSITE_ID,
      kind: 'collection',
      content: JSON.stringify({ name: 'Nested collection', items: [] }),
    });
    const { result } = renderAddHook(collectionTarget);

    const submitted = await submitUrl(result, POST_URL);

    expect(submitted).toBe(false);
    expect(result.current.form.getFieldState(URL_FIELD).error?.message).toBe("Collections can't be added here.");
    expect(mocks.commitUpdateCollectionItem).not.toHaveBeenCalled();
  });

  it('shows the required-field error and does nothing for an empty URL', async () => {
    const { result } = renderAddHook(collectionTarget);

    const submitted = await submitUrl(result, '');

    expect(submitted).toBe(false);
    await waitFor(() => {
      expect(result.current.form.getFieldState(URL_FIELD).error?.message).toBe('Paste a post URL.');
    });
    expect(mocks.getDetails).not.toHaveBeenCalled();
    expect(mocks.getOrFetch).not.toHaveBeenCalled();
    expect(mocks.commitUpdateCollectionItem).not.toHaveBeenCalled();
  });

  it('does nothing when there is no signed-in user', async () => {
    mockCurrentUserPubky = undefined;
    const { result, onAddedAction } = renderAddHook(collectionTarget);

    const submitted = await submitUrl(result, POST_URL);

    expect(submitted).toBe(false);
    expect(mocks.getDetails).not.toHaveBeenCalled();
    expect(mocks.getOrFetch).not.toHaveBeenCalled();
    expect(mocks.commitUpdateCollectionItem).not.toHaveBeenCalled();
    expect(onAddedAction).not.toHaveBeenCalled();
  });

  it('shows inline and toast errors when saving fails', async () => {
    mocks.commitUpdateCollectionItem.mockRejectedValueOnce(new Error('save failed'));
    const { result, onAddedAction } = renderAddHook(collectionTarget);

    const submitted = await submitUrl(result, POST_URL);

    expect(submitted).toBe(false);
    expect(result.current.form.getFieldState(URL_FIELD).error?.message).toBe('Failed to add post.');
    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Failed to add post.',
    });
    expect(mocks.loggerError).toHaveBeenCalled();
    expect(onAddedAction).not.toHaveBeenCalled();
  });

  it('shows inline and toast errors when the duplicate check fails', async () => {
    mocks.getDetails.mockRejectedValueOnce(new Error('dexie read failed'));
    const { result, onAddedAction } = renderAddHook(collectionTarget);

    const submitted = await submitUrl(result, POST_URL);

    expect(submitted).toBe(false);
    expect(result.current.form.getFieldState(URL_FIELD).error?.message).toBe('Failed to add post.');
    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Failed to add post.',
    });
    expect(mocks.loggerError).toHaveBeenCalled();
    expect(mocks.getOrFetch).not.toHaveBeenCalled();
    expect(mocks.commitUpdateCollectionItem).not.toHaveBeenCalled();
    expect(onAddedAction).not.toHaveBeenCalled();
  });
});

describe('useAddPostByUrl - bookmark target', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUserPubky = CURRENT_USER_PUBKY;
    mocks.bookmarkExists.mockResolvedValue(false);
    mocks.getOrFetch.mockResolvedValue({
      id: POST_COMPOSITE_ID,
      kind: 'short',
      content: 'Hello Pubky',
    });
    mocks.bookmarkCommitCreate.mockResolvedValue(undefined);
  });

  it('fetches the pasted post and saves it as a bookmark', async () => {
    const { result, onAddedAction } = renderAddHook(bookmarkTarget);

    const submitted = await submitUrl(result, POST_URL);

    expect(submitted).toBe(true);
    expect(mocks.getDetails).not.toHaveBeenCalled();
    expect(mocks.bookmarkExists).toHaveBeenCalledWith(POST_COMPOSITE_ID);
    expect(mocks.getOrFetch).toHaveBeenCalledWith({
      compositeId: POST_COMPOSITE_ID,
      viewerId: CURRENT_USER_PUBKY,
    });
    expect(mocks.bookmarkCommitCreate).toHaveBeenCalledWith({
      postId: POST_COMPOSITE_ID,
      userId: CURRENT_USER_PUBKY,
    });
    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Added to Bookmarks',
    });
    expect(onAddedAction).toHaveBeenCalledWith(POST_COMPOSITE_ID);
  });

  it('shows an inline error when the post is already bookmarked', async () => {
    mocks.bookmarkExists.mockResolvedValue(true);
    const { result } = renderAddHook(bookmarkTarget);

    const submitted = await submitUrl(result, POST_URL);

    expect(submitted).toBe(false);
    expect(result.current.form.getFieldState(URL_FIELD).error?.message).toBe('This post is already bookmarked.');
    expect(mocks.getOrFetch).not.toHaveBeenCalled();
    expect(mocks.bookmarkCommitCreate).not.toHaveBeenCalled();
  });

  it('shows an inline error for invalid URLs without fetching or saving', async () => {
    const { result } = renderAddHook(bookmarkTarget);

    const submitted = await submitUrl(result, 'https://app.pubky.org/profile/not-a-post');

    expect(submitted).toBe(false);
    await waitFor(() => {
      expect(result.current.form.getFieldState(URL_FIELD).error?.message).toBe('Enter a valid Pubky post URL.');
    });
    expect(mocks.bookmarkExists).not.toHaveBeenCalled();
    expect(mocks.bookmarkCommitCreate).not.toHaveBeenCalled();
  });

  it('shows inline and toast errors when saving fails', async () => {
    mocks.bookmarkCommitCreate.mockRejectedValueOnce(new Error('save failed'));
    const { result, onAddedAction } = renderAddHook(bookmarkTarget);

    const submitted = await submitUrl(result, POST_URL);

    expect(submitted).toBe(false);
    expect(result.current.form.getFieldState(URL_FIELD).error?.message).toBe('Failed to add post.');
    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Failed to add post.',
    });
    expect(mocks.loggerError).toHaveBeenCalled();
    expect(onAddedAction).not.toHaveBeenCalled();
  });

  it('shows inline and toast errors when the bookmark check fails', async () => {
    mocks.bookmarkExists.mockRejectedValueOnce(new Error('dexie read failed'));
    const { result, onAddedAction } = renderAddHook(bookmarkTarget);

    const submitted = await submitUrl(result, POST_URL);

    expect(submitted).toBe(false);
    expect(result.current.form.getFieldState(URL_FIELD).error?.message).toBe('Failed to add post.');
    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Failed to add post.',
    });
    expect(mocks.loggerError).toHaveBeenCalled();
    expect(mocks.getOrFetch).not.toHaveBeenCalled();
    expect(mocks.bookmarkCommitCreate).not.toHaveBeenCalled();
    expect(onAddedAction).not.toHaveBeenCalled();
  });
});
