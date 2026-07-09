import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamPostsController } from '@/controllers/stream/posts/posts';
import type { TReadPostStreamChunkResponse } from '@/controllers/stream/posts/posts.types';
import { buildDiscoverCollectionsStreamId } from '@/models/stream/post/postStream.types';
import { asOpaque } from '@/test-utils/type-assertions';
import { DiscoverCollections } from './DiscoverCollections';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockAuthState: { hasHydrated: boolean } = { hasHydrated: false };

// Captured args from the (mocked) infinite-scroll hook so tests can drive auto-load
// without a real IntersectionObserver.
let capturedInfiniteScroll: { onLoadMore: () => void; hasMore: boolean; isLoading: boolean } | undefined;

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => `${namespace ?? ''}.${key}`,
}));

vi.mock('@/hooks/useInfiniteScroll/useInfiniteScroll', () => ({
  useInfiniteScroll: (opts: { onLoadMore: () => void; hasMore: boolean; isLoading: boolean }) => {
    capturedInfiniteScroll = opts;
    return { sentinelRef: vi.fn() };
  },
}));

vi.mock('@/controllers/stream/posts/posts', () => ({
  StreamPostsController: {
    getOrFetchStreamSlice: vi.fn(),
    prepareStreamForInitialLoad: vi.fn(),
    getCachedLastPostTimestamp: vi.fn(),
  },
}));

vi.mock('@/stores/auth/auth.store', () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}));

const mockToast = vi.fn();
vi.mock('@/molecules/Toaster/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/molecules/AvatarStack/AvatarStack', () => ({
  AvatarStack: ({ pubkys }: { pubkys: string[] }) => <div data-testid="avatar-stack" data-pubkys={pubkys.join(',')} />,
}));

vi.mock('@/molecules/AvatarStack/AvatarStack.skeleton', () => ({
  AvatarStackSkeleton: ({ count }: { count: number }) => <div data-testid="avatar-stack-skeleton" data-count={count} />,
}));

vi.mock('@/organisms/Collections/CollectionCard/CollectionCard', () => ({
  CollectionCard: ({ authorPubky, postId }: { authorPubky: string; postId: string }) => (
    <div data-testid="collection-card" data-author-pubky={authorPubky} data-post-id={postId} />
  ),
}));

vi.mock('@/organisms/Collections/CollectionCard/CollectionCard.skeleton', () => ({
  CollectionCardSkeleton: () => <div data-testid="collection-card-skeleton" />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockGetOrFetchStreamSlice = vi.mocked(StreamPostsController.getOrFetchStreamSlice);
const mockPrepareStreamForInitialLoad = vi.mocked(StreamPostsController.prepareStreamForInitialLoad);
const mockGetCachedLastPostTimestamp = vi.mocked(StreamPostsController.getCachedLastPostTimestamp);

function makeSlice({
  nextPageIds = [],
  reachedEnd = true,
  nextCursor = 0,
}: {
  nextPageIds?: string[];
  reachedEnd?: boolean;
  nextCursor?: number;
} = {}) {
  return asOpaque<TReadPostStreamChunkResponse>({ nextPageIds, reachedEnd, nextCursor });
}

beforeEach(() => {
  vi.clearAllMocks();
  capturedInfiniteScroll = undefined;
  mockAuthState = { hasHydrated: false };
  mockPrepareStreamForInitialLoad.mockResolvedValue(undefined);
  mockGetCachedLastPostTimestamp.mockResolvedValue(0);
  mockGetOrFetchStreamSlice.mockResolvedValue(makeSlice({ reachedEnd: true }));
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
// Own / bookmarked / empty filtering for this stream lives in the shared stream layer (deleted
// is dropped there for every feed; see post.ts `filterStreamPosts` + the `getOrFetchStreamSlice`
// filter callback), so the component just renders `postIds`. Those filters are unit-tested in the
// application layer.

describe('DiscoverCollections', () => {
  it('pre-hydration: renders title + skeletons and never fetches', () => {
    mockAuthState = { hasHydrated: false };

    render(<DiscoverCollections />);

    expect(screen.getByText('collections.discover.title')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-stack-skeleton')).toHaveAttribute('data-count', '3');
    expect(screen.queryByTestId('collection-card')).not.toBeInTheDocument();
    // The data layer (hook) is not mounted until hydration, so no fetch fires.
    expect(mockPrepareStreamForInitialLoad).not.toHaveBeenCalled();
    expect(mockGetOrFetchStreamSlice).not.toHaveBeenCalled();
  });

  it('post-hydration: fetches the discover stream at offset 0 and renders the returned ids', async () => {
    mockAuthState = { hasHydrated: true };
    mockGetOrFetchStreamSlice.mockResolvedValue(makeSlice({ nextPageIds: ['a:p1', 'b:p2'], reachedEnd: true }));

    await act(async () => {
      render(<DiscoverCollections />);
    });

    const streamId = buildDiscoverCollectionsStreamId();
    await waitFor(() => {
      expect(mockPrepareStreamForInitialLoad).toHaveBeenCalledWith({ streamId });
    });
    // Discover is skip-paginated: the initial fetch starts at offset 0.
    expect(mockGetOrFetchStreamSlice).toHaveBeenCalledWith(expect.objectContaining({ streamId, streamTail: 0 }));

    await waitFor(() => {
      expect(screen.getAllByTestId('collection-card')).toHaveLength(2);
    });
  });

  it('auto-loads: wires loadMore + hasMore into infinite scroll and resumes from the returned cursor', async () => {
    mockAuthState = { hasHydrated: true };
    mockGetOrFetchStreamSlice
      .mockResolvedValueOnce(makeSlice({ nextPageIds: ['a:p1'], reachedEnd: false, nextCursor: 20 }))
      .mockResolvedValueOnce(makeSlice({ nextPageIds: ['b:more'], reachedEnd: true, nextCursor: 21 }));

    await act(async () => {
      render(<DiscoverCollections />);
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('collection-card').length).toBeGreaterThan(0);
    });
    expect(capturedInfiniteScroll?.hasMore).toBe(true);

    await act(async () => {
      capturedInfiniteScroll?.onLoadMore();
    });

    await waitFor(() => {
      expect(mockGetOrFetchStreamSlice.mock.calls.length).toBeGreaterThan(1);
    });
    // Resumes from the raw offset threaded back by the first page (20), not a visible-count cursor.
    expect(mockGetOrFetchStreamSlice.mock.calls.at(-1)?.[0]).toMatchObject({ streamTail: 20 });
  });

  it('renders the empty state when the stream is exhausted with nothing to show', async () => {
    mockAuthState = { hasHydrated: true };
    mockGetOrFetchStreamSlice.mockResolvedValue(makeSlice({ nextPageIds: [], reachedEnd: true }));

    await act(async () => {
      render(<DiscoverCollections />);
    });

    await waitFor(() => {
      expect(screen.getByText('collections.discover.empty')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('collection-card')).not.toBeInTheDocument();
  });

  it('derives AvatarStack pubkys from the visible cards', async () => {
    mockAuthState = { hasHydrated: true };
    mockGetOrFetchStreamSlice.mockResolvedValue(makeSlice({ nextPageIds: ['a:1', 'a:2', 'b:3'], reachedEnd: true }));

    await act(async () => {
      render(<DiscoverCollections />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('avatar-stack')).toHaveAttribute('data-pubkys', 'a,b');
    });
  });

  it('on fetch failure: fires the load-failed toast and surfaces the empty state', async () => {
    mockAuthState = { hasHydrated: true };
    mockGetOrFetchStreamSlice.mockRejectedValue(new Error('boom'));

    await act(async () => {
      render(<DiscoverCollections />);
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({ variant: 'error', description: 'collections.loadFailed' });
    });
    expect(screen.queryByTestId('collection-card')).not.toBeInTheDocument();
    expect(screen.getByText('collections.discover.empty')).toBeInTheDocument();
  });

  describe('DiscoverCollections - Snapshots', () => {
    it('matches the snapshot for the pre-hydration skeleton state', () => {
      mockAuthState = { hasHydrated: false };
      const { container } = render(<DiscoverCollections />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches the snapshot for the populated state', async () => {
      mockAuthState = { hasHydrated: true };
      mockGetOrFetchStreamSlice.mockResolvedValue(
        makeSlice({ nextPageIds: ['authorA:p1', 'authorB:p2'], reachedEnd: false, nextCursor: 2 }),
      );

      const { container } = await act(async () => render(<DiscoverCollections />));
      await waitFor(() => {
        expect(screen.getAllByTestId('collection-card')).toHaveLength(2);
      });
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches the snapshot for the exhausted-empty state', async () => {
      mockAuthState = { hasHydrated: true };
      mockGetOrFetchStreamSlice.mockResolvedValue(makeSlice({ nextPageIds: [], reachedEnd: true }));

      const { container } = await act(async () => render(<DiscoverCollections />));
      await waitFor(() => {
        expect(screen.getByText('collections.discover.empty')).toBeInTheDocument();
      });
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
