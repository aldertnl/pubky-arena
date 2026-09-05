import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useArenaIdeas } from '@/hooks/useArenaIdeas/useArenaIdeas';
import { useStreamPagination } from '@/hooks/useStreamPagination/useStreamPagination';
import type { ArenaIdea } from '@/libs/arena/arena';
import { TIMEFRAME } from '@/stores/hot/hot.types';
import { useArenaPersonPost } from './useArenaPersonPost';

vi.mock('@/hooks/useArenaIdeas/useArenaIdeas', () => ({ useArenaIdeas: vi.fn() }));
vi.mock('@/hooks/useStreamPagination/useStreamPagination', () => ({ useStreamPagination: vi.fn() }));

const now = Date.UTC(2026, 8, 5);
const postWindow = { timeframe: TIMEFRAME.THIS_WEEK, now };
const loadMore = vi.fn(async () => {});
const refresh = vi.fn(async () => {});
function idea(id: string, overrides: Partial<ArenaIdea> = {}): ArenaIdea {
  return {
    id,
    author: 'person',
    kind: 'short',
    indexedAt: now - 1000,
    tags: 1,
    replies: 0,
    reposts: 0,
    replyTo: null,
    preview: id,
    ...overrides,
  };
}
function setPage(ideas: ArenaIdea[], overrides: Partial<ReturnType<typeof useStreamPagination>> = {}) {
  vi.mocked(useArenaIdeas).mockReturnValue({ ideas, error: null, loading: false });
  vi.mocked(useStreamPagination).mockReturnValue({
    postIds: ideas.map(({ id }) => id),
    loading: false,
    loadingMore: false,
    hasMore: false,
    error: null,
    loadMore,
    refresh,
    prependPosts: vi.fn(),
    prependOptimisticPosts: vi.fn(),
    removePosts: vi.fn(),
    removePostsOptimistically: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setPage([]);
});

describe('selected person’s most popular post', () => {
  it('uses the author timeline and Arena score, excluding replies, other authors, and out-of-window posts', () => {
    setPage([
      idea('person:tags', { tags: 10 }),
      idea('person:popular', { replies: 3 }),
      idea('person:reply', { tags: 1000, replyTo: 'other:root' }),
      idea('other:post', { author: 'other', tags: 1000 }),
      idea('person:old', { tags: 1000, indexedAt: now - 8 * 86400000 }),
    ]);
    const { result } = renderHook(() => useArenaPersonPost('person', postWindow));
    expect(useStreamPagination).toHaveBeenCalledWith({ streamId: 'timeline:author:person:all', limit: 50 });
    expect(result.current.post?.id).toBe('person:popular');
  });

  it('waits for later pages before choosing a winner and stops at the timeframe boundary', () => {
    const recent = idea('person:recent');
    setPage([recent], { hasMore: true });
    const { result, rerender } = renderHook(() => useArenaPersonPost('person', postWindow));
    expect(loadMore).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ loading: true, post: undefined });
    setPage([recent, idea('person:winner', { tags: 100 }), idea('person:old', { indexedAt: now - 8 * 86400000 })], {
      hasMore: true,
    });
    rerender();
    expect(loadMore).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ loading: false, post: { id: 'person:winner' } });
  });

  it('checks all pages for All time instead of stopping at the first popular candidate', () => {
    setPage([idea('person:old', { indexedAt: 0 })], { hasMore: true });
    const { result } = renderHook(() => useArenaPersonPost('person', { ...postWindow, timeframe: TIMEFRAME.ALL_TIME }));
    expect(loadMore).toHaveBeenCalledOnce();
    expect(result.current.loading).toBe(true);
  });

  it('waits for the current page projection, then continues past a fully filtered page', () => {
    setPage([], { postIds: ['person:deleted'], hasMore: true });
    vi.mocked(useArenaIdeas).mockReturnValue({ ideas: [], error: null, loading: true });
    const { result, rerender } = renderHook(() => useArenaPersonPost('person', postWindow));
    expect(loadMore).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
    vi.mocked(useArenaIdeas).mockReturnValue({ ideas: [], error: null, loading: false });
    rerender();
    expect(loadMore).toHaveBeenCalledOnce();
  });

  it('returns an empty result when the author has no eligible posts', () => {
    const { result } = renderHook(() => useArenaPersonPost('person', postWindow));
    expect(result.current).toMatchObject({ post: undefined, loading: false, error: null });
  });

  it('does not present an incomplete winner after a page failure and supports retry', async () => {
    setPage([idea('person:partial')], { error: 'Could not fetch posts', hasMore: true });
    const { result } = renderHook(() => useArenaPersonPost('person', postWindow));
    expect(result.current).toMatchObject({ post: undefined, loading: false, error: 'Could not fetch posts' });
    expect(loadMore).not.toHaveBeenCalled();
    await result.current.retry();
    expect(refresh).toHaveBeenCalledOnce();
  });
});
