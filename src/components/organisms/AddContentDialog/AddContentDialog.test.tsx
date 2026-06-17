import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AddContentTarget } from '@/hooks/useAddPostByUrl/useAddPostByUrl.types';
import { TimelineFeedContext } from '@/organisms/Timeline/Feed/TimelineFeed/TimelineFeedContext';
import { AddContentDialog } from './AddContentDialog';

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

const translations: Record<string, string> = {
  success: 'Success',
  error: 'Error',
  addContent: 'Add Content',
  title: 'Add Content',
  description: 'Add a post or article from your feed or paste a url directly.',
  feedTitle: 'Add from feed',
  feedInstructionLead: 'Find a post ',
  feedInstructionRest: 'you want to add and click the collections button.',
  urlTitle: 'Paste post url',
  urlInstruction: 'You can also paste a post URL to quickly add it to your collection.',
  urlInputLabel: 'Post URL',
  submitUrl: 'Add URL',
  urlRequired: 'Paste a post URL.',
  invalidUrl: 'Enter a valid Pubky post URL.',
  duplicateUrl: 'This post is already in the collection.',
  saveFailed: 'Failed to add post.',
  addedToast: 'Added to {name}',
};

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

vi.mock('@/stores/auth/auth.store', () => ({
  useAuthStore: (selector: (state: { currentUserPubky: string }) => unknown) =>
    selector({ currentUserPubky: CURRENT_USER_PUBKY }),
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
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    Object.entries(values ?? {}).reduce(
      (message, [name, value]) => message.replace(`{${name}}`, value),
      translations[key] ?? key,
    ),
}));

const collectionTarget: AddContentTarget = {
  kind: 'collection',
  collectionId: COLLECTION_ID,
  collectionName: COLLECTION_NAME,
};

const bookmarkTarget: AddContentTarget = { kind: 'bookmark' };

function renderDialog({ target = collectionTarget }: { target?: AddContentTarget } = {}) {
  return render(<AddContentDialog target={target} />);
}

function openDialog() {
  fireEvent.click(screen.getByRole('button', { name: 'Add Content' }));
}

describe('AddContentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDetails.mockResolvedValue(createCollectionDetails());
    mocks.getOrFetch.mockResolvedValue({
      id: POST_COMPOSITE_ID,
      kind: 'short',
      content: 'Hello Pubky',
    });
    mocks.commitUpdateCollectionItem.mockResolvedValue(undefined);
  });

  it('renders the two add-content paths after opening', () => {
    renderDialog();
    openDialog();

    expect(screen.getByRole('heading', { name: 'Add Content' })).toBeInTheDocument();
    expect(screen.getByText('Add from feed')).toBeInTheDocument();
    expect(screen.getByText('Paste post url')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Post URL' })).toHaveAttribute('placeholder', 'https://');
  });

  it('matches snapshot when open', () => {
    renderDialog();
    openDialog();

    expect(screen.getByRole('dialog')).toMatchSnapshot();
  });

  it('renders add from feed as static guidance, not a clickable route', () => {
    renderDialog();
    openDialog();

    expect(screen.queryByRole('button', { name: 'Add from feed' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Add from feed'));

    expect(mocks.getOrFetch).not.toHaveBeenCalled();
    expect(mocks.commitUpdateCollectionItem).not.toHaveBeenCalled();
  });

  it('adds a typed post URL through the collection persistence path', async () => {
    renderDialog();
    openDialog();

    fireEvent.change(screen.getByRole('textbox', { name: 'Post URL' }), { target: { value: POST_URL } });
    fireEvent.click(screen.getByRole('button', { name: 'Add URL', hidden: true }));

    await waitFor(() => {
      expect(mocks.commitUpdateCollectionItem).toHaveBeenCalledWith({
        collectionId: COLLECTION_ID,
        postId: POST_COMPOSITE_ID,
        shouldAdd: true,
      });
    });
    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Added to Proof of Work',
    });
  });

  it('shows inline validation for invalid URLs without saving', async () => {
    renderDialog();
    openDialog();

    fireEvent.change(screen.getByRole('textbox', { name: 'Post URL' }), { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add URL', hidden: true }));

    expect(await screen.findByText('Enter a valid Pubky post URL.')).toBeInTheDocument();
    expect(mocks.getOrFetch).not.toHaveBeenCalled();
    expect(mocks.commitUpdateCollectionItem).not.toHaveBeenCalled();
  });

  it('shows an inline error when the post is already in the collection', async () => {
    mocks.getDetails.mockResolvedValue(createCollectionDetails([POST_URI]));
    renderDialog();
    openDialog();

    fireEvent.change(screen.getByRole('textbox', { name: 'Post URL' }), { target: { value: POST_URL } });
    fireEvent.click(screen.getByRole('button', { name: 'Add URL', hidden: true }));

    expect(await screen.findByText('This post is already in the collection.')).toBeInTheDocument();
    expect(mocks.getOrFetch).not.toHaveBeenCalled();
    expect(mocks.commitUpdateCollectionItem).not.toHaveBeenCalled();
  });

  it('adds a URL pasted into the field with the keyboard', async () => {
    renderDialog();
    openDialog();

    const input = screen.getByRole('textbox', { name: 'Post URL' });
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => POST_URL,
      },
    });

    await waitFor(() => {
      expect(mocks.commitUpdateCollectionItem).toHaveBeenCalledWith({
        collectionId: COLLECTION_ID,
        postId: POST_COMPOSITE_ID,
        shouldAdd: true,
      });
    });
  });

  it('shows validation errors for an invalid pasted URL', async () => {
    renderDialog();
    openDialog();

    const input = screen.getByRole('textbox', { name: 'Post URL' });
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => 'https://example.com',
      },
    });

    expect(await screen.findByText('Enter a valid Pubky post URL.')).toBeInTheDocument();
    expect(mocks.commitUpdateCollectionItem).not.toHaveBeenCalled();
  });

  it('adds a pasted post URL as a bookmark when target is bookmark', async () => {
    mocks.bookmarkExists.mockResolvedValue(false);
    mocks.bookmarkCommitCreate.mockResolvedValue(undefined);
    renderDialog({ target: bookmarkTarget });
    openDialog();

    const input = screen.getByRole('textbox', { name: 'Post URL' });
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => POST_URL,
      },
    });

    await waitFor(() => {
      expect(mocks.bookmarkCommitCreate).toHaveBeenCalledWith({
        postId: POST_COMPOSITE_ID,
        userId: CURRENT_USER_PUBKY,
      });
    });
    expect(mocks.commitUpdateCollectionItem).not.toHaveBeenCalled();
  });

  it('optimistically prepends the added post to the surrounding timeline feed', async () => {
    const prependItems = vi.fn();
    render(
      <TimelineFeedContext.Provider
        value={{ variant: 'collection', prependPosts: vi.fn(), prependItems, removePosts: vi.fn() }}
      >
        <AddContentDialog target={collectionTarget} />
      </TimelineFeedContext.Provider>,
    );
    openDialog();

    fireEvent.paste(screen.getByRole('textbox', { name: 'Post URL' }), {
      clipboardData: { getData: () => POST_URL },
    });

    await waitFor(() => {
      expect(prependItems).toHaveBeenCalledWith(POST_COMPOSITE_ID);
    });
  });

  it('disables the URL input and submit button while a save is in flight', async () => {
    let resolvePost: (value: { id: string; kind: string; content: string }) => void = () => {};
    mocks.getOrFetch.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      }),
    );
    renderDialog();
    openDialog();

    fireEvent.change(screen.getByRole('textbox', { name: 'Post URL' }), { target: { value: POST_URL } });
    fireEvent.click(screen.getByRole('button', { name: 'Add URL', hidden: true }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Post URL' })).toBeDisabled();
    });
    expect(screen.getByRole('button', { name: 'Add URL', hidden: true })).toBeDisabled();

    // Settle the in-flight save so its state updates don't leak into later tests.
    resolvePost({ id: POST_COMPOSITE_ID, kind: 'short', content: 'Hello Pubky' });
    await waitFor(() => {
      expect(mocks.commitUpdateCollectionItem).toHaveBeenCalled();
    });
  });
});
