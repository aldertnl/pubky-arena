import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NEXUS_POSTS_PER_PAGE } from '@/config/nexus';
import { PostStreamTypes } from '@/models/stream/post/postStream.types';
import { useBookmarksFeed } from './useBookmarksFeed';

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  getDetailsByIds: vi.fn(),
  prepareStreamForInitialLoad: vi.fn(),
  getCachedLastPostTimestamp: vi.fn(),
  getOrFetchStreamSlice: vi.fn(),
}));

vi.mock('@/controllers/bookmark/bookmark', () => ({
  BookmarkController: { getAll: mocks.getAll },
}));

vi.mock('@/controllers/post/post', () => ({
  PostController: { getDetailsByIds: mocks.getDetailsByIds },
}));

vi.mock('@/controllers/stream/posts/posts', () => ({
  StreamPostsController: {
    prepareStreamForInitialLoad: mocks.prepareStreamForInitialLoad,
    getCachedLastPostTimestamp: mocks.getCachedLastPostTimestamp,
    getOrFetchStreamSlice: mocks.getOrFetchStreamSlice,
  },
}));

vi.mock('@/libs/logger/logger', () => ({
  Logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

let mockHasHydrated = true;
vi.mock('@/stores/auth/auth.store', () => ({
  useAuthStore: (selector?: (state: { hasHydrated: boolean }) => unknown) => {
    const state = { hasHydrated: mockHasHydrated };
    return selector ? selector(state) : state;
  },
}));

// Render track: control the live-query result directly (the query body is
// covered separately) and expose the captured query fn for the filtering test.
let mockLiveIds: string[] | undefined;
let lastQueryFn: (() => unknown) | null = null;
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (queryFn: () => unknown) => {
    lastQueryFn = queryFn;
    return mockLiveIds;
  },
}));

const reachedEndSlice = {
  nextPageIds: [] as string[],
  cacheMissPostIds: [] as string[],
  timestamp: 0,
  reachedEnd: true,
};

describe('useBookmarksFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasHydrated = true;
    mockLiveIds = [];
    lastQueryFn = null;
    mocks.getAll.mockResolvedValue([]);
    mocks.getDetailsByIds.mockResolvedValue([]);
    mocks.prepareStreamForInitialLoad.mockResolvedValue(undefined);
    mocks.getCachedLastPostTimestamp.mockResolvedValue(0);
    mocks.getOrFetchStreamSlice.mockResolvedValue({ ...reachedEndSlice });
  });

  it('renders bookmarks from the live query as postIds', async () => {
    mockLiveIds = ['a:1', 'b:2'];
    const { result } = renderHook(() => useBookmarksFeed());

    await waitFor(() => expect(result.current.postIds).toEqual(['a:1', 'b:2']));
  });

  it('stays loading until the live query resolves', async () => {
    mockLiveIds = undefined;
    const { result } = renderHook(() => useBookmarksFeed());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(mocks.getOrFetchStreamSlice).toHaveBeenCalled());
    // The seed finishing does not flip loading off while the live query is unresolved.
    expect(result.current.loading).toBe(true);
  });

  it('seeds the bookmarks stream from Nexus on mount once auth has hydrated', async () => {
    renderHook(() => useBookmarksFeed());

    await waitFor(() => {
      expect(mocks.prepareStreamForInitialLoad).toHaveBeenCalledWith({
        streamId: PostStreamTypes.TIMELINE_BOOKMARKS_ALL,
      });
      expect(mocks.getOrFetchStreamSlice).toHaveBeenCalledWith(
        expect.objectContaining({ streamId: PostStreamTypes.TIMELINE_BOOKMARKS_ALL, limit: NEXUS_POSTS_PER_PAGE }),
      );
    });
  });

  it('does not seed before auth has hydrated', () => {
    mockHasHydrated = false;
    renderHook(() => useBookmarksFeed());

    expect(mocks.prepareStreamForInitialLoad).not.toHaveBeenCalled();
    expect(mocks.getOrFetchStreamSlice).not.toHaveBeenCalled();
  });

  it('removePosts drops the id from postIds', async () => {
    mockLiveIds = ['a:1', 'b:2'];
    const { result } = renderHook(() => useBookmarksFeed());
    await waitFor(() => expect(result.current.postIds).toEqual(['a:1', 'b:2']));

    act(() => result.current.removePosts('a:1'));

    expect(result.current.postIds).toEqual(['b:2']);
  });

  it('prependItems optimistically adds the id to the head', async () => {
    mockLiveIds = ['b:2'];
    const { result } = renderHook(() => useBookmarksFeed());
    await waitFor(() => expect(result.current.postIds).toEqual(['b:2']));

    act(() => result.current.prependItems('a:1'));

    expect(result.current.postIds).toEqual(['a:1', 'b:2']);
  });

  it('defers removal of an unbookmarked post until removePosts is called (save picker UX)', async () => {
    mockLiveIds = ['a:1', 'b:2'];
    const { result, rerender } = renderHook(() => useBookmarksFeed());
    await waitFor(() => expect(result.current.postIds).toEqual(['a:1', 'b:2']));

    // Unbookmarked elsewhere: the live query drops it, but the open picker must
    // keep its card mounted until it closes.
    mockLiveIds = ['b:2'];
    rerender();
    expect(result.current.postIds).toEqual(['a:1', 'b:2']);

    // Picker closes -> explicit removal finally drops the card.
    act(() => result.current.removePosts('a:1'));
    expect(result.current.postIds).toEqual(['b:2']);
  });

  it('reports hasMore=false once Nexus is exhausted and the window is not full', async () => {
    mockLiveIds = ['a:1', 'b:2'];
    mocks.getOrFetchStreamSlice.mockResolvedValue({
      ...reachedEndSlice,
      nextPageIds: ['a:1', 'b:2'],
    });
    const { result } = renderHook(() => useBookmarksFeed());

    await waitFor(() => expect(mocks.getOrFetchStreamSlice).toHaveBeenCalled());
    await waitFor(() => expect(result.current.hasMore).toBe(false));
  });

  it('live query filters out collections and deleted posts', async () => {
    mocks.getAll.mockResolvedValue(['a:1', 'b:2', 'c:3', 'd:4']);
    mocks.getDetailsByIds.mockResolvedValue([
      { kind: 'short', content: 'hello' },
      { kind: 'collection', content: 'a saved collection' },
      { kind: 'short', content: '[DELETED]' },
      { kind: 'short', content: 'world' },
    ]);

    renderHook(() => useBookmarksFeed());
    await waitFor(() => expect(mocks.prepareStreamForInitialLoad).toHaveBeenCalled());

    expect(typeof lastQueryFn).toBe('function');
    const ids = await lastQueryFn!();

    expect(ids).toEqual(['a:1', 'd:4']);
    expect(mocks.getDetailsByIds).toHaveBeenCalledWith({ compositeIds: ['a:1', 'b:2', 'c:3', 'd:4'] });
  });

  it('live query slices the result down to the current window', async () => {
    const total = NEXUS_POSTS_PER_PAGE + 2;
    const ids = Array.from({ length: total }, (_, index) => `a:${index}`);
    mocks.getAll.mockResolvedValue(ids);
    mocks.getDetailsByIds.mockResolvedValue(ids.map(() => ({ kind: 'short', content: 'hi' })));

    renderHook(() => useBookmarksFeed());
    await waitFor(() => expect(mocks.prepareStreamForInitialLoad).toHaveBeenCalled());

    const windowed = (await lastQueryFn!()) as string[];

    expect(windowed).toHaveLength(NEXUS_POSTS_PER_PAGE);
    expect(windowed).toEqual(ids.slice(0, NEXUS_POSTS_PER_PAGE));
  });

  it('seeds the next Nexus slice on loadMore while more pages remain', async () => {
    mocks.getOrFetchStreamSlice.mockResolvedValue({
      nextPageIds: ['a:1'],
      cacheMissPostIds: [],
      timestamp: 123,
      reachedEnd: false,
    });
    const { result } = renderHook(() => useBookmarksFeed());

    await waitFor(() => expect(mocks.getOrFetchStreamSlice).toHaveBeenCalledTimes(1));
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(mocks.getOrFetchStreamSlice).toHaveBeenCalledTimes(2);
    expect(mocks.getOrFetchStreamSlice).toHaveBeenLastCalledWith(
      expect.objectContaining({ lastPostId: 'a:1', streamTail: 123 }),
    );
  });

  it('surfaces the error message when the seed fetch fails', async () => {
    mocks.getOrFetchStreamSlice.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useBookmarksFeed());

    await waitFor(() => expect(result.current.error).toBe('network down'));
  });

  it('prependItems ignores ids already shown', async () => {
    mockLiveIds = ['a:1', 'b:2'];
    const { result } = renderHook(() => useBookmarksFeed());
    await waitFor(() => expect(result.current.postIds).toEqual(['a:1', 'b:2']));

    act(() => result.current.prependItems('a:1'));

    expect(result.current.postIds).toEqual(['a:1', 'b:2']);
  });

  it('prependItems adds only the new ids to the head, preserving their order', async () => {
    mockLiveIds = ['b:2'];
    const { result } = renderHook(() => useBookmarksFeed());
    await waitFor(() => expect(result.current.postIds).toEqual(['b:2']));

    act(() => result.current.prependItems(['x:1', 'b:2', 'y:3']));

    expect(result.current.postIds).toEqual(['x:1', 'y:3', 'b:2']);
  });

  it('defers removal of multiple unbookmarked posts and keeps their positions', async () => {
    mockLiveIds = ['a:1', 'b:2', 'c:3'];
    const { result, rerender } = renderHook(() => useBookmarksFeed());
    await waitFor(() => expect(result.current.postIds).toEqual(['a:1', 'b:2', 'c:3']));

    // a:1 and c:3 unbookmarked elsewhere: the live query drops them, but their open
    // pickers must keep both cards in place until each picker closes.
    mockLiveIds = ['b:2'];
    rerender();
    expect(result.current.postIds).toEqual(['a:1', 'b:2', 'c:3']);

    act(() => result.current.removePosts(['a:1', 'c:3']));
    expect(result.current.postIds).toEqual(['b:2']);
  });
});
