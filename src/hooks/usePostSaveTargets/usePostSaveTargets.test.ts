import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePostSaveTargets } from './usePostSaveTargets';

const AUTHOR_PUBKY = 'o1gg96ewuojmopcjbz8895478wdtxtzzber7aezq6ror5a91j7dy';
const POST_ID = '0034BBBDFK83G';
const POST_COMPOSITE_ID = `${AUTHOR_PUBKY}:${POST_ID}`;
const POST_URI = `pubky://${AUTHOR_PUBKY}/pub/pubky.app/posts/${POST_ID}`;
const WEB_POST_URL = `https://pubky.app/post/${AUTHOR_PUBKY}/${POST_ID}`;

const mocks = vi.hoisted(() => ({
  commitUpdateCollectionItem: vi.fn(),
  commitCreateCollection: vi.fn(),
  toggleBookmark: vi.fn(),
  toast: vi.fn(),
}));

const translations: Record<string, string> = {
  success: 'Success',
  addedToCollection: 'Post added to {name}.',
  removedFromCollection: 'Post removed from {name}.',
};

vi.mock('@/controllers/post/post', () => ({
  PostController: {
    commitUpdateCollectionItem: (...args: unknown[]) => mocks.commitUpdateCollectionItem(...args),
    commitCreateCollection: (...args: unknown[]) => mocks.commitCreateCollection(...args),
  },
}));

vi.mock('@/hooks/useBookmark/useBookmark', () => ({
  useBookmark: () => ({
    isBookmarked: true,
    isLoading: false,
    isToggling: false,
    toggle: mocks.toggleBookmark,
  }),
}));

vi.mock('@/hooks/useAuthoredCollections/useAuthoredCollections', () => ({
  useAuthoredCollections: () => ({
    collections: [
      {
        details: { id: 'author:collection1' },
        content: {
          name: 'Proof of Work',
          description: 'Bitcoin writing',
          items: [POST_URI],
        },
      },
      {
        details: { id: 'author:collection2' },
        content: {
          name: 'AI Papers',
          description: '',
          items: [],
        },
      },
      {
        details: { id: 'author:collection3' },
        content: {
          name: 'Web URLs',
          description: '',
          items: [WEB_POST_URL],
        },
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/molecules/Toaster/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/stores/auth/auth.store', () => ({
  useAuthStore: (selector: (state: { currentUserPubky: string }) => unknown) =>
    selector({ currentUserPubky: 'current-user' }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    Object.entries(values ?? {}).reduce(
      (message, [name, value]) => message.replace(`{${name}}`, value),
      translations[key] ?? key,
    ),
}));

describe('usePostSaveTargets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('combines bookmark state and collection membership', () => {
    const { result } = renderHook(() => usePostSaveTargets(POST_COMPOSITE_ID));

    expect(result.current.isBookmarked).toBe(true);
    expect(result.current.collections).toEqual([
      expect.objectContaining({ id: 'author:collection1', name: 'Proof of Work', isSaved: true }),
      expect.objectContaining({ id: 'author:collection2', name: 'AI Papers', isSaved: false }),
      expect.objectContaining({ id: 'author:collection3', name: 'Web URLs', isSaved: true }),
    ]);
  });

  it('toggles collection membership separately from bookmarks', async () => {
    const { result } = renderHook(() => usePostSaveTargets(POST_COMPOSITE_ID));

    await act(async () => {
      await result.current.toggleCollection('author:collection1');
    });

    expect(mocks.commitUpdateCollectionItem).toHaveBeenCalledWith({
      collectionId: 'author:collection1',
      postId: POST_COMPOSITE_ID,
      shouldAdd: false,
    });
    expect(mocks.toggleBookmark).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Post removed from Proof of Work.',
    });
  });

  it('shows the target collection name when adding a post to a collection', async () => {
    const { result } = renderHook(() => usePostSaveTargets(POST_COMPOSITE_ID));

    await act(async () => {
      await result.current.toggleCollection('author:collection2');
    });

    expect(mocks.commitUpdateCollectionItem).toHaveBeenCalledWith({
      collectionId: 'author:collection2',
      postId: POST_COMPOSITE_ID,
      shouldAdd: true,
    });
    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Post added to AI Papers.',
    });
  });

  it('creates a collection with the current post URI as first item', async () => {
    const { result } = renderHook(() => usePostSaveTargets(POST_COMPOSITE_ID));

    await act(async () => {
      await result.current.createCollectionWithPost('New collection');
    });

    expect(mocks.commitCreateCollection).toHaveBeenCalledWith({
      authorId: 'current-user',
      name: 'New collection',
      items: [POST_URI],
    });
  });
});
