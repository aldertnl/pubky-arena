import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookmarksItems } from './BookmarksItems';

const { mockUseBookmarksFeed } = vi.hoisted(() => ({ mockUseBookmarksFeed: vi.fn() }));

vi.mock('@/hooks/useBookmarksFeed/useBookmarksFeed', () => ({
  useBookmarksFeed: () => mockUseBookmarksFeed(),
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => `${namespace ?? ''}.${key}`,
}));

// Render the post ids + the empty-state slot inline so we can assert what the
// grid shows and the custom copy it falls back to when empty.
vi.mock('@/organisms/Timeline/Posts/GridPosts/GridPosts', () => ({
  TimelineGridPosts: ({
    postIds,
    emptyState,
    showEndMessage,
  }: {
    postIds: string[];
    emptyState?: ReactNode;
    showEndMessage?: boolean;
  }) => (
    <div data-testid="timeline-grid-posts" data-show-end-message={String(showEndMessage)}>
      {postIds.map((id) => (
        <div key={id} data-testid="grid-post">
          {id}
        </div>
      ))}
      <div data-testid="feed-empty-slot">{emptyState}</div>
    </div>
  ),
}));

// The add-content dialog (trigger button + wiring) is covered by its own tests;
// here we only assert it is rendered and targeted at bookmarks.
vi.mock('@/organisms/AddContentDialog/AddContentDialog', () => ({
  AddContentDialog: ({ target }: { target: { kind: string } }) => (
    <div data-testid="add-content-dialog" data-target-kind={target.kind} />
  ),
}));

const baseFeed = {
  postIds: [] as string[],
  loading: false,
  loadingMore: false,
  error: null as string | null,
  hasMore: false,
  loadMore: vi.fn(),
  prependItems: vi.fn(),
  prependPosts: vi.fn(),
  removePosts: vi.fn(),
};

describe('BookmarksItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBookmarksFeed.mockReturnValue({ ...baseFeed });
  });

  it('renders the add-content dialog wired to the bookmark target', () => {
    render(<BookmarksItems />);

    expect(screen.getByTestId('add-content-dialog')).toHaveAttribute('data-target-kind', 'bookmark');
  });

  it('renders the bookmarked posts from the feed in a grid', () => {
    mockUseBookmarksFeed.mockReturnValue({ ...baseFeed, postIds: ['a:1', 'b:2'] });
    render(<BookmarksItems />);

    expect(screen.getAllByTestId('grid-post').map((node) => node.textContent)).toEqual(['a:1', 'b:2']);
  });

  it('passes the shared collection-empty state to the grid instead of "No posts found"', () => {
    render(<BookmarksItems />);

    expect(screen.getByTestId('collection-items-empty')).toBeInTheDocument();
    expect(screen.getByText('collections.single.empty')).toBeInTheDocument();
  });

  it('suppresses the end-of-feed message (finite, library-style surface)', () => {
    render(<BookmarksItems />);

    expect(screen.getByTestId('timeline-grid-posts')).toHaveAttribute('data-show-end-message', 'false');
  });
});

describe('BookmarksItems - Snapshots', () => {
  it('matches the snapshot', () => {
    mockUseBookmarksFeed.mockReturnValue({ ...baseFeed });
    const { container } = render(<BookmarksItems />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
