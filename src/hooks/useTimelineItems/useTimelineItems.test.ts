import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import * as Core from '@/core';
import { useTimelineItems } from './useTimelineItems';

vi.mock('@/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks')>();
  return {
    ...actual,
    useStreamPagination: vi.fn(),
  };
});

vi.mock('@/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core')>();
  return {
    ...actual,
    StreamPostsController: {
      ...actual.StreamPostsController,
      getPlainRepostOriginals: vi.fn(),
    },
  };
});

vi.mock('@/libs', async () => {
  const actual = await vi.importActual('@/libs');
  return {
    ...actual,
    Logger: { error: vi.fn() },
  };
});

const mockUseStreamPagination = vi.mocked((await import('@/hooks')).useStreamPagination);
const mockGetPlainRepostOriginals = vi.mocked(Core.StreamPostsController.getPlainRepostOriginals);

const basePagination = {
  postIds: [] as string[],
  loading: false,
  loadingMore: false,
  error: null,
  hasMore: false,
  loadMore: vi.fn(),
  refresh: vi.fn(),
  prependPosts: vi.fn(),
  removePosts: vi.fn(),
};

describe('useTimelineItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlainRepostOriginals.mockResolvedValue(new Map());
  });

  it('returns empty items when postIds is empty', () => {
    mockUseStreamPagination.mockReturnValue({ ...basePagination, postIds: [] });

    const { result } = renderHook(() => useTimelineItems({ streamId: 'test' }));

    expect(result.current.items).toEqual([]);
    expect(result.current.postIds).toEqual([]);
  });

  it('produces single items when no reposts', async () => {
    const postIds = ['alice:post1', 'bob:post2'];
    mockUseStreamPagination.mockReturnValue({ ...basePagination, postIds });
    mockGetPlainRepostOriginals.mockResolvedValue(new Map());

    const { result } = renderHook(() => useTimelineItems({ streamId: 'test' }));

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    expect(result.current.items[0]).toEqual({
      type: Core.TIMELINE_ITEM_TYPE.SINGLE,
      postId: 'alice:post1',
    });
    expect(result.current.items[1]).toEqual({
      type: Core.TIMELINE_ITEM_TYPE.SINGLE,
      postId: 'bob:post2',
    });
  });

  it('groups plain reposts into RepostGroupItem', async () => {
    const postIds = ['miguel:repost1', 'vlada:repost2', 'matt:post3'];
    mockUseStreamPagination.mockReturnValue({ ...basePagination, postIds });

    const plainRepostOriginals: Core.PlainRepostOriginals = new Map([
      ['miguel:repost1', { originalPostId: 'orlando:post50', indexedAt: 1000 }],
      ['vlada:repost2', { originalPostId: 'orlando:post50', indexedAt: 2000 }],
    ]);
    mockGetPlainRepostOriginals.mockResolvedValue(plainRepostOriginals);

    const { result } = renderHook(() => useTimelineItems({ streamId: 'test' }));

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    expect(result.current.items[0].type).toBe(Core.TIMELINE_ITEM_TYPE.REPOST_GROUP);
    expect(result.current.items[1]).toEqual({
      type: Core.TIMELINE_ITEM_TYPE.SINGLE,
      postId: 'matt:post3',
    });
  });

  it('falls back to single items on error', async () => {
    const postIds = ['alice:post1'];
    mockUseStreamPagination.mockReturnValue({ ...basePagination, postIds });
    mockGetPlainRepostOriginals.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useTimelineItems({ streamId: 'test' }));

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    expect(result.current.items[0]).toEqual({
      type: Core.TIMELINE_ITEM_TYPE.SINGLE,
      postId: 'alice:post1',
    });
  });

  it('passes through pagination props', () => {
    const loadMore = vi.fn();
    const refresh = vi.fn();
    mockUseStreamPagination.mockReturnValue({
      ...basePagination,
      postIds: ['a:1'],
      loading: true,
      loadingMore: true,
      error: 'err',
      hasMore: true,
      loadMore,
      refresh,
    });

    const { result } = renderHook(() => useTimelineItems({ streamId: 'test' }));

    expect(result.current.loading).toBe(true);
    expect(result.current.loadingMore).toBe(true);
    expect(result.current.error).toBe('err');
    expect(result.current.hasMore).toBe(true);
    expect(result.current.loadMore).toBe(loadMore);
    expect(result.current.refresh).toBe(refresh);
  });

  it('does not regroup when postIds reference is the same', async () => {
    const postIds = ['a:1'];
    mockUseStreamPagination.mockReturnValue({ ...basePagination, postIds });

    const { result, rerender } = renderHook(() => useTimelineItems({ streamId: 'test' }));

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    mockGetPlainRepostOriginals.mockClear();
    rerender();

    expect(mockGetPlainRepostOriginals).not.toHaveBeenCalled();
  });
});
