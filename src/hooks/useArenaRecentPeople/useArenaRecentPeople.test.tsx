import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchController } from '@/controllers/search/search';
import { useArenaIdeas } from '@/hooks/useArenaIdeas/useArenaIdeas';
import { useStreamPagination } from '@/hooks/useStreamPagination/useStreamPagination';
import type { ArenaIdea } from '@/libs/arena/arena';
import { REACH } from '@/stores/home/home.types';
import { TIMEFRAME } from '@/stores/hot/hot.types';
import { useArenaRecentPeople } from './useArenaRecentPeople';

const mocks = vi.hoisted(() => ({ muted: new Set<string>(), hydrate: vi.fn(async () => {}) }));
vi.mock('@/hooks/useArenaIdeas/useArenaIdeas', () => ({ useArenaIdeas: vi.fn() }));
vi.mock('@/hooks/useStreamPagination/useStreamPagination', () => ({ useStreamPagination: vi.fn() }));
vi.mock('@/hooks/useMutedUsers/useMutedUsers', () => ({
  useMutedUsers: () => ({ isMuted: (id: string) => mocks.muted.has(id) }),
}));
vi.mock('@/controllers/search/search', () => ({ SearchController: { fetchUsersByTags: vi.fn() } }));
vi.mock('@/controllers/stream/users/users', () => ({ StreamUserController: { getOrFetchUsers: mocks.hydrate } }));
vi.mock('@/controllers/file/file', () => ({ FileController: { getAvatarUrl: (id: string) => `/avatar/${id}` } }));
vi.mock('@/controllers/user/user', () => ({
  UserController: {
    getManyDetails: async ({ userIds }: { userIds: string[] }) =>
      new Map(userIds.map((id) => [id, { id, name: id, bio: '', image: 'avatar', status: null }])),
    getManyCounts: async ({ userIds }: { userIds: string[] }) =>
      new Map(userIds.map((id) => [id, { tagged: 4, posts: 12, replies: 8, followers: 23, following: 0 }])),
  },
}));

const now = Date.UTC(2026, 8, 5);
const defaults = { timeframe: TIMEFRAME.TODAY, now, reach: REACH.ALL, topic: null };
const loadMore = vi.fn(async () => {});
const refresh = vi.fn(async () => {});
function idea(author: string, indexedAt = now - 1000, suffix = 'post'): ArenaIdea {
  return {
    id: `${author}:${suffix}`,
    author,
    indexedAt,
    kind: 'short',
    preview: 'A post without the selected profile tag',
    tags: 0,
    replies: 0,
    reposts: 0,
    replyTo: null,
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
  mocks.muted.clear();
  vi.mocked(SearchController.fetchUsersByTags).mockResolvedValue([]);
  setPage([]);
});

describe('recent Arena people', () => {
  it('ranks distinct authors by latest post, respects reach and timeframe, and excludes muted people', async () => {
    mocks.muted.add('muted');
    setPage([
      idea('second', now - 2000),
      idea('first', now - 3000, 'older'),
      idea('first', now - 1000, 'newest'),
      idea('muted', now),
      idea('old', now - 2 * 86400000),
    ]);
    const { result } = renderHook(() => useArenaRecentPeople({ ...defaults, reach: REACH.NETWORK }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users.map(({ id }) => id)).toEqual(['first', 'second']);
    expect(useStreamPagination).toHaveBeenCalledWith({ streamId: 'timeline:wot:all', limit: 50, includeMuted: true });
    expect(result.current.users[0]).toMatchObject({
      avatarUrl: '/avatar/first',
      counts: { tags: 4, posts: 12, replies: 8, followers: 23 },
    });
  });

  it('filters profile tags and stops once every possible matching author has been found', async () => {
    vi.mocked(SearchController.fetchUsersByTags).mockResolvedValue([
      { user_id: 'tagged', score: 1 },
      { user_id: 'muted', score: 1 },
    ]);
    mocks.muted.add('muted');
    setPage([idea('untagged', now), idea('tagged')], { hasMore: true });
    const { result } = renderHook(() =>
      useArenaRecentPeople({ ...defaults, timeframe: TIMEFRAME.ALL_TIME, topic: ' Pubky ' }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(SearchController.fetchUsersByTags).toHaveBeenCalledWith({ tags: 'pubky', skip: 0, limit: 20 });
    expect(result.current.users.map(({ id }) => id)).toEqual(['tagged']);
    expect(useStreamPagination).toHaveBeenCalledWith({ streamId: 'timeline:all:all', limit: 50, includeMuted: true });
    expect(loadMore).not.toHaveBeenCalled();
  });

  it('pages beyond a repeated author until ten different people are available', async () => {
    const repeated = Array.from({ length: 50 }, (_, index) => idea('first', now - index, String(index)));
    setPage(repeated, { hasMore: true });
    const { result, rerender } = renderHook(() => useArenaRecentPeople(defaults));
    expect(result.current.loading).toBe(true);
    expect(loadMore).toHaveBeenCalledOnce();
    setPage([...repeated, ...Array.from({ length: 9 }, (_, index) => idea(`person${index}`, now - 100 - index))], {
      hasMore: true,
    });
    rerender();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toHaveLength(10);
    expect(result.current.users[0].id).toBe('first');
    expect(loadMore).toHaveBeenCalledOnce();
  });

  it('waits for page projection and stops at the timeframe boundary even with fewer than ten people', async () => {
    setPage([], { postIds: ['old:post'], hasMore: true });
    vi.mocked(useArenaIdeas).mockReturnValue({ ideas: [], loading: true, error: null });
    const { result, rerender } = renderHook(() => useArenaRecentPeople(defaults));
    expect(loadMore).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
    setPage([idea('recent'), idea('old', now - 2 * 86400000)], { hasMore: true });
    rerender();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users.map(({ id }) => id)).toEqual(['recent']);
    expect(loadMore).not.toHaveBeenCalled();
  });

  it('stops after a page failure and exposes retry instead of showing an incomplete ranking', async () => {
    setPage([idea('partial')], { hasMore: true, error: 'Could not fetch posts' });
    const { result } = renderHook(() => useArenaRecentPeople(defaults));
    expect(result.current).toMatchObject({ users: [], loading: false, error: 'Could not fetch posts' });
    expect(loadMore).not.toHaveBeenCalled();
    await act(async () => result.current.retry());
    expect(refresh).toHaveBeenCalledOnce();
  });
});
