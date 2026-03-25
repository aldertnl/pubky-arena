import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as Core from '@/core';
import { GroupedRepostPost } from './GroupedRepostPost';

vi.mock('@/hooks', () => ({
  useIsMobile: vi.fn(() => false),
  usePostDetails: vi.fn(() => ({
    postDetails: { content: 'Hello world', attachments: [] },
  })),
}));

vi.mock('@/libs', async () => {
  const actual = await vi.importActual('@/libs');
  return { ...actual };
});

vi.mock('@/config', () => ({
  POST_TAGS_MAX_COUNT: 5,
  POST_TAGS_MAX_LENGTH: 30,
  POST_TAGS_MAX_TOTAL_CHARS: 100,
}));

vi.mock('@/atoms', () => ({
  Container: ({
    children,
    onClick,
    className,
    ...rest
  }: {
    children?: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    [key: string]: unknown;
  }) => (
    <div onClick={onClick} className={className} {...rest}>
      {children}
    </div>
  ),
  Card: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({
    children,
    className,
    onClick,
  }: {
    children?: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
  }) => (
    <div data-testid="card-content" className={className} onClick={onClick}>
      {children}
    </div>
  ),
}));

vi.mock('@/molecules', () => ({
  GroupedRepostHeader: ({
    reposterPubkys,
    earliestTimestamp,
  }: {
    reposterPubkys: string[];
    earliestTimestamp: number;
  }) => (
    <div data-testid="grouped-repost-header" data-count={reposterPubkys.length} data-timestamp={earliestTimestamp}>
      Header
    </div>
  ),
  PostDeleted: () => <div data-testid="post-deleted">Deleted</div>,
}));

vi.mock('@/organisms', () => ({
  PostHeader: ({ postId }: { postId: string }) => <div data-testid={`post-header-${postId}`}>Header</div>,
  PostContent: ({ postId }: { postId: string }) => <div data-testid={`post-content-${postId}`}>Content</div>,
  PostActionsBar: ({
    postId,
    onReplyClick,
    onRepostClick,
  }: {
    postId: string;
    onReplyClick?: () => void;
    onRepostClick?: () => void;
  }) => (
    <div data-testid={`post-actions-${postId}`}>
      <button data-testid="reply-btn" onClick={onReplyClick}>
        Reply
      </button>
      <button data-testid="repost-btn" onClick={onRepostClick}>
        Repost
      </button>
    </div>
  ),
  ClickableTagsList: () => <div data-testid="tags-list">Tags</div>,
  PostTagsPanel: () => <div data-testid="tags-panel">Tags Panel</div>,
  DialogReply: ({ open, postId }: { open: boolean; postId: string }) =>
    open ? <div data-testid={`reply-dialog-${postId}`}>Reply Dialog</div> : null,
  DialogRepost: ({ open, postId }: { open: boolean; postId: string }) =>
    open ? <div data-testid={`repost-dialog-${postId}`}>Repost Dialog</div> : null,
}));

const mockItem: Core.RepostGroupItem = {
  type: Core.TIMELINE_ITEM_TYPE.REPOST_GROUP,
  originalPostId: 'orlando:post50',
  repostPostIds: ['miguel:repost1', 'vlada:repost2'],
  reposterPubkys: ['miguel', 'vlada'],
  earliestTimestamp: 1707000200,
};

describe('GroupedRepostPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders GroupedRepostHeader with correct props', () => {
    render(<GroupedRepostPost item={mockItem} />);

    const header = screen.getByTestId('grouped-repost-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('data-count', '2');
    expect(header).toHaveAttribute('data-timestamp', '1707000200');
  });

  it('renders PostHeader and PostContent for the original post', () => {
    render(<GroupedRepostPost item={mockItem} />);

    expect(screen.getByTestId('post-header-orlando:post50')).toBeInTheDocument();
    expect(screen.getByTestId('post-content-orlando:post50')).toBeInTheDocument();
  });

  it('renders PostActionsBar targeting the original post', () => {
    render(<GroupedRepostPost item={mockItem} />);

    expect(screen.getByTestId('post-actions-orlando:post50')).toBeInTheDocument();
  });

  it('calls onClick when card content is clicked', () => {
    const onClick = vi.fn();
    render(<GroupedRepostPost item={mockItem} onClick={onClick} />);

    fireEvent.click(screen.getByTestId('card-content'));
    expect(onClick).toHaveBeenCalled();
  });

  it('does not call onClick when header is clicked', () => {
    const onClick = vi.fn();
    render(<GroupedRepostPost item={mockItem} onClick={onClick} />);

    fireEvent.click(screen.getByTestId('grouped-repost-header'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders PostDeleted when post is deleted', async () => {
    const { usePostDetails } = await import('@/hooks');
    vi.mocked(usePostDetails).mockReturnValueOnce({
      postDetails: { content: '[DELETED]', attachments: [] },
    } as ReturnType<typeof usePostDetails>);

    render(<GroupedRepostPost item={mockItem} />);

    expect(screen.getByTestId('post-deleted')).toBeInTheDocument();
    expect(screen.queryByTestId('grouped-repost-header')).not.toBeInTheDocument();
  });

  it('opens reply dialog when reply button is clicked', () => {
    render(<GroupedRepostPost item={mockItem} />);

    expect(screen.queryByTestId('reply-dialog-orlando:post50')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('reply-btn'));

    expect(screen.getByTestId('reply-dialog-orlando:post50')).toBeInTheDocument();
  });

  it('opens repost dialog when repost button is clicked', () => {
    render(<GroupedRepostPost item={mockItem} />);

    expect(screen.queryByTestId('repost-dialog-orlando:post50')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('repost-btn'));

    expect(screen.getByTestId('repost-dialog-orlando:post50')).toBeInTheDocument();
  });

  it('renders ClickableTagsList for the original post', () => {
    render(<GroupedRepostPost item={mockItem} />);

    expect(screen.getByTestId('tags-list')).toBeInTheDocument();
  });
});

describe('GroupedRepostPost - Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('matches snapshot for default state', () => {
    const { container } = render(<GroupedRepostPost item={mockItem} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for single reposter', () => {
    const singleItem: Core.RepostGroupItem = {
      ...mockItem,
      repostPostIds: ['miguel:repost1'],
      reposterPubkys: ['miguel'],
    };
    const { container } = render(<GroupedRepostPost item={singleItem} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for deleted post', async () => {
    const { usePostDetails } = await import('@/hooks');
    vi.mocked(usePostDetails).mockReturnValueOnce({
      postDetails: { content: '[DELETED]', attachments: [] },
    } as ReturnType<typeof usePostDetails>);

    const { container } = render(<GroupedRepostPost item={mockItem} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
