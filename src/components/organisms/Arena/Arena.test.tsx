import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UseBulkUserAvatarsResult } from '@/hooks/useBulkUserAvatars/useBulkUserAvatars.types';
import type { UseHotTagsResult } from '@/hooks/useHotTags/useHotTags.types';
import type { UseStreamPaginationResult } from '@/hooks/useStreamPagination/useStreamPagination.types';
import type { ArenaIdea } from '@/libs/arena/arena';
import { useAuthStore } from '@/stores/auth/auth.store';
import { REACH } from '@/stores/home/home.types';
import { useHotStore } from '@/stores/hot/hot.store';
import { TIMEFRAME } from '@/stores/hot/hot.types';
import { Arena } from './Arena';

const mocks = vi.hoisted(() => ({
  hotTags: vi.fn<() => UseHotTagsResult>(),
  stream: vi.fn<() => UseStreamPaginationResult>(),
  avatars: vi.fn<(ids: string[]) => UseBulkUserAvatarsResult>(),
  ideas: vi.fn<() => { ideas: ArenaIdea[]; error: string | null }>(),
  isMuted: vi.fn<(id: string) => boolean>(),
}));
vi.mock('@/hooks/useBulkUserAvatars/useBulkUserAvatars', () => ({ useBulkUserAvatars: mocks.avatars }));
vi.mock('@/hooks/useMutedUsers/useMutedUsers', () => ({ useMutedUsers: () => ({ isMuted: mocks.isMuted }) }));
vi.mock('@/hooks/useHotTags/useHotTags', () => ({ useHotTags: mocks.hotTags }));
vi.mock('@/hooks/useStreamPagination/useStreamPagination', () => ({ useStreamPagination: mocks.stream }));
vi.mock('@/hooks/useArenaIdeas/useArenaIdeas', () => ({ useArenaIdeas: mocks.ideas }));
vi.mock('@/hooks/useIsMobile/useIsMobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/useRequireAuth/useRequireAuth', () => ({
  useRequireAuth: () => ({ requireAuth: (onAuthenticated: () => void) => onAuthenticated() }),
}));

function chooseAll() {
  fireEvent.click(screen.getByRole('button', { name: 'Choose topic tag' }));
  fireEvent.click(screen.getByRole('button', { name: 'all' }));
}

describe('Arena filters and topic standings', () => {
  beforeEach(() => {
    mocks.isMuted.mockReturnValue(false);
    mocks.ideas.mockReturnValue({ ideas: [], error: null });
    mocks.avatars.mockReturnValue({
      usersMap: new Map(),
      getUsersWithAvatars: (ids) => ids.map((id) => ({ id, name: id })),
      isLoading: false,
    });
    useAuthStore.setState({ currentUserPubky: null });
    useHotStore.setState({ reach: REACH.ALL, timeframe: TIMEFRAME.THIS_MONTH });
    mocks.hotTags.mockReturnValue({
      tags: [{ name: 'pubky', count: 10 }],
      rawTags: [{ label: 'pubky', tagged_count: 10, taggers_count: 1, taggers_id: [] }],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    mocks.stream.mockReturnValue({
      postIds: [],
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refresh: vi.fn(),
      prependPosts: vi.fn(),
      prependOptimisticPosts: vi.fn(),
      removePosts: vi.fn(),
      removePostsOptimistically: vi.fn(),
    });
  });

  function setMutedPost(overrides: Partial<ArenaIdea> = {}) {
    mocks.isMuted.mockImplementation((id) => id === 'muted');
    mocks.ideas.mockReturnValue({
      ideas: [
        {
          id: 'muted:post',
          author: 'muted',
          preview: 'A hidden idea',
          kind: 'short',
          indexedAt: Date.now(),
          tags: 1,
          replies: 0,
          reposts: 0,
          replyTo: null,
          ...overrides,
        },
      ],
      error: null,
    });
  }

  it('explains a muted-only result and allows a reversible temporary reveal', () => {
    setMutedPost();
    render(<Arena />);
    expect(screen.getByText('Posts are hidden by your mute settings.')).toBeInTheDocument();
    expect(screen.queryByText('No posts found for this tag.')).not.toBeInTheDocument();
    expect(screen.queryByText('A hidden idea')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show muted' }));
    expect(screen.getByText('A hidden idea')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide muted' }));
    expect(screen.queryByText('A hidden idea')).not.toBeInTheDocument();
    expect(screen.getByText('Posts are hidden by your mute settings.')).toBeInTheDocument();
  });

  it('ranks visible contenders from first place and restores muted contenders on demand', () => {
    setMutedPost({ tags: 99 });
    const hidden = mocks.ideas().ideas[0];
    mocks.ideas.mockReturnValue({
      ideas: [hidden, { ...hidden, id: 'visible:post', author: 'visible', preview: 'Visible idea', tags: 1 }],
      error: null,
    });
    render(<Arena />);
    expect(screen.getByRole('button', { name: /Rank 1,.*Visible idea/ })).toBeInTheDocument();
    expect(screen.queryByText('A hidden idea')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show muted' }));
    expect(screen.getByRole('button', { name: /Rank 1,.*A hidden idea/ })).toBeInTheDocument();
  });

  it('does not blame muting when muted posts fall outside the timeframe', () => {
    setMutedPost({ indexedAt: Date.UTC(2000, 0, 1) });
    render(<Arena />);
    expect(screen.getByText('No posts found for this tag.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show muted' })).not.toBeInTheDocument();
  });

  it('resets the temporary reveal after a topic change and when Reset is clicked', () => {
    setMutedPost();
    render(<Arena />);
    fireEvent.click(screen.getByRole('button', { name: 'Show muted' }));
    chooseAll();
    expect(screen.queryByText('A hidden idea')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show muted' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.queryByText('A hidden idea')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show muted' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.queryByText('A hidden idea')).not.toBeInTheDocument();
  });

  it('shows at most three taggers without a counter, fetching only deduplicated visible profiles', () => {
    const rawTags = Array.from({ length: 10 }, (_, index) => ({
      label: `topic${index}`,
      tagged_count: 662,
      taggers_count: 11,
      taggers_id: [
        'shared',
        'shared',
        `tagger${index}a`,
        `tagger${index}b`,
        `tagger${index}c`,
        `tagger${index}d`,
        `overflow${index}`,
      ],
    }));
    mocks.hotTags.mockReturnValue({ ...mocks.hotTags(), rawTags });
    render(<Arena />);

    for (const tag of rawTags) {
      const stack = screen.getByTestId(`arena-topic-taggers-${tag.label}`);
      expect(stack.children).toHaveLength(3);
      expect(stack).not.toHaveTextContent(/\+/);
      expect(screen.getByRole('group', { name: `${tag.label} topic taggers` })).toContainElement(stack);
      const topicButton = screen.getByRole('button', { name: `${tag.label} tag (662 posts)` });
      expect(topicButton).not.toContainElement(stack);
    }
    expect(mocks.avatars).toHaveBeenLastCalledWith([
      'shared',
      ...rawTags.flatMap((_, index) => [`tagger${index}a`, `tagger${index}b`]),
    ]);
    expect(screen.queryByText('+659')).not.toBeInTheDocument();
  });

  it('excludes muted taggers and hides empty stacks', () => {
    mocks.isMuted.mockImplementation((id) => id === 'muted');
    mocks.hotTags.mockReturnValue({
      ...mocks.hotTags(),
      rawTags: [
        {
          label: 'pubky',
          tagged_count: 20,
          taggers_count: 5,
          taggers_id: ['muted', 'one', 'one', 'two', 'three', 'four'],
        },
      ],
    });
    const { rerender } = render(<Arena />);
    expect(mocks.avatars).toHaveBeenLastCalledWith(['one', 'two', 'three']);
    expect(screen.getByTestId('arena-topic-taggers-pubky').children).toHaveLength(3);

    mocks.isMuted.mockReturnValue(true);
    rerender(<Arena />);
    expect(screen.queryByTestId('arena-topic-taggers-pubky')).not.toBeInTheDocument();
    expect(mocks.avatars).toHaveBeenLastCalledWith([]);
  });

  it('does not expose the capped Nexus total and fills visible slots after muting', () => {
    mocks.hotTags.mockReturnValue({
      ...mocks.hotTags(),
      rawTags: [
        {
          label: 'pubky',
          tagged_count: 662,
          taggers_count: 20,
          taggers_id: Array.from({ length: 20 }, (_, i) => `tagger${i}`),
        },
      ],
    });
    const { rerender } = render(<Arena />);
    expect(screen.getByTestId('arena-topic-taggers-pubky').children).toHaveLength(3);
    expect(screen.getByTestId('arena-topic-taggers-pubky')).not.toHaveTextContent(/\+/);
    expect(mocks.avatars).toHaveBeenLastCalledWith(['tagger0', 'tagger1', 'tagger2']);

    mocks.isMuted.mockImplementation((id) => id === 'tagger0');
    rerender(<Arena />);
    expect(screen.getByTestId('arena-topic-taggers-pubky').children).toHaveLength(3);
    expect(mocks.avatars).toHaveBeenLastCalledWith(['tagger1', 'tagger2', 'tagger3']);
  });

  it('updates the stack with topic data and shows no overflow for a single tagger', () => {
    mocks.hotTags.mockReturnValue({
      ...mocks.hotTags(),
      rawTags: [{ label: 'pubky', tagged_count: 20, taggers_count: 1, taggers_id: ['one'] }],
    });
    const { rerender } = render(<Arena />);
    expect(screen.getByRole('group', { name: 'pubky topic taggers' })).toBeInTheDocument();
    expect(screen.getByTestId('arena-topic-taggers-pubky').children).toHaveLength(1);

    mocks.hotTags.mockReturnValue({
      ...mocks.hotTags(),
      rawTags: [{ label: 'music', tagged_count: 3, taggers_count: 2, taggers_id: ['two', 'three'] }],
    });
    rerender(<Arena />);
    expect(screen.queryByTestId('arena-topic-taggers-pubky')).not.toBeInTheDocument();
    expect(screen.getByTestId('arena-topic-taggers-music').children).toHaveLength(2);
    expect(mocks.avatars).toHaveBeenLastCalledWith(['two', 'three']);
  });

  it('keeps avatar loading limited to the arena view', async () => {
    const user = userEvent.setup();
    mocks.hotTags.mockReturnValue({
      ...mocks.hotTags(),
      rawTags: [{ label: 'pubky', tagged_count: 20, taggers_count: 1, taggers_id: ['one'] }],
    });
    render(<Arena />);
    expect(screen.getByTestId('arena-topic-taggers-pubky')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View: In arena' }));
    await user.click(screen.getByRole('menuitem', { name: 'In grid' }));
    expect(screen.queryByTestId('arena-topic-taggers-pubky')).not.toBeInTheDocument();
    expect(mocks.avatars).toHaveBeenLastCalledWith([]);
  });

  it('switches from the top tag to an unfiltered stream and back through the same picker', () => {
    render(<Arena />);
    expect(mocks.stream).toHaveBeenLastCalledWith({
      streamId: 'timeline:all:all:pubky',
      limit: 50,
      includeMuted: true,
    });
    chooseAll();
    expect(mocks.stream).toHaveBeenLastCalledWith({ streamId: 'timeline:all:all', limit: 50, includeMuted: true });
    expect(screen.getByRole('button', { name: 'Choose topic tag' })).toHaveTextContent('all');
    expect(screen.getByText('No posts found for these filters.')).toBeInTheDocument();
    expect(screen.queryByTestId('arena-tag-connectors')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Choose topic tag' }));
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Top tags' })).getByRole('button', { name: 'pubky tag (10 posts)' }),
    );
    expect(mocks.stream).toHaveBeenLastCalledWith({
      streamId: 'timeline:all:all:pubky',
      limit: 50,
      includeMuted: true,
    });
  });

  it.each(['loading', 'error', 'empty'])('loads All independently of %s trending tags', (state) => {
    mocks.hotTags.mockReturnValue({
      tags: [],
      rawTags: [],
      isLoading: state === 'loading',
      error: state === 'error' ? 'Unavailable' : null,
      refetch: vi.fn(),
    });
    render(<Arena />);
    expect(mocks.stream).not.toHaveBeenCalled();
    chooseAll();
    expect(mocks.stream).toHaveBeenLastCalledWith({ streamId: 'timeline:all:all', limit: 50, includeMuted: true });
    expect(screen.getByText('No posts found for these filters.')).toBeInTheDocument();
  });

  it('retains All across content, timeframe, and reach changes, and Reset returns to the top tag', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ currentUserPubky: 'viewer' });
    render(<Arena />);
    chooseAll();
    await user.click(screen.getByRole('button', { name: 'Content: Content' }));
    await user.click(screen.getByRole('menuitem', { name: 'Posts' }));
    expect(screen.getByRole('button', { name: 'Choose topic tag' })).toHaveTextContent('all');
    await user.click(screen.getByRole('button', { name: 'Timeframe: This month’s' }));
    await user.click(screen.getByRole('menuitem', { name: 'All-time' }));
    expect(mocks.stream).toHaveBeenLastCalledWith({
      streamId: 'total_engagement:all:all',
      limit: 24,
      includeMuted: true,
    });
    await user.click(screen.getByRole('button', { name: 'Reach: From everyone' }));
    await user.click(screen.getByRole('menuitem', { name: 'From my network' }));
    expect(mocks.stream).toHaveBeenLastCalledWith({
      streamId: 'total_engagement:wot:all',
      limit: 24,
      includeMuted: true,
    });
    expect(screen.getByRole('button', { name: 'Choose topic tag' })).toHaveTextContent('all');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('button', { name: 'Choose topic tag' })).toHaveTextContent('pubky');
    expect(mocks.stream).toHaveBeenLastCalledWith({
      streamId: 'timeline:all:all:pubky',
      limit: 50,
      includeMuted: true,
    });
  });
});
