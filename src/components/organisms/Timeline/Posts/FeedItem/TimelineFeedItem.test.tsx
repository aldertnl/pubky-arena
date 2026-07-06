import { useRouter } from 'next/navigation';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePostDetails } from '@/hooks/usePostDetails/usePostDetails';
import { PostStreamTypes } from '@/models/stream/post/postStream.types';
import { TimelineFeedItem } from './TimelineFeedItem';

const mockPush = vi.fn();
const mockTtlRef = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/hooks/usePostDetails/usePostDetails', () => ({
  usePostDetails: vi.fn(),
}));

vi.mock('@/hooks/useTtlSubscription/useTtlSubscription', () => ({
  useTtlSubscription: () => ({
    ref: mockTtlRef,
    isVisible: false,
  }),
}));

vi.mock('@/atoms/Container/Container', () => ({
  Container: ({
    children,
    'data-cy': dataCy,
    onKeyDown,
    ...props
  }: {
    children?: React.ReactNode;
    'data-cy'?: string;
    onKeyDown?: (event: React.KeyboardEvent) => void;
    [key: string]: unknown;
  }) => (
    <div data-testid={dataCy ?? 'container'} onKeyDown={onKeyDown} {...props}>
      {children}
    </div>
  ),
}));

vi.mock('@/organisms/Collections/CollectionCard/CollectionCard', () => ({
  CollectionCard: ({ authorPubky, postId }: { authorPubky: string; postId: string }) => (
    <div data-testid="collection-card" data-author={authorPubky} data-post-id={postId} />
  ),
}));

vi.mock('@/organisms/Collections/CollectionCard/CollectionCard.skeleton', () => ({
  CollectionCardSkeleton: () => <div data-testid="collection-card-skeleton" />,
}));

vi.mock('@/organisms/PostMain/PostMain', () => ({
  PostMain: ({ postId }: { postId: string }) => <div data-testid="post-main" data-post-id={postId} />,
}));

vi.mock('@/organisms/Timeline/PostReplies/PostReplies', () => ({
  TimelinePostReplies: ({ postId }: { postId: string }) => <div data-testid="post-replies" data-post-id={postId} />,
}));

const mockUsePostDetails = vi.mocked(usePostDetails);
const mockUseRouter = vi.mocked(useRouter);

const COLLECTION_POST_ID = 'author-pubky:collection-post-id';
const COLLECTION_STREAM_ID = PostStreamTypes.TIMELINE_ALL_COLLECTION;
const DEFAULT_STREAM_ID = PostStreamTypes.TIMELINE_ALL_ALL;

describe('TimelineFeedItem', () => {
  const cardRef = vi.fn();
  const onPostKeyDown = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as ReturnType<typeof useRouter>);
  });

  it('renders a standalone CollectionCard for collection-kind posts', () => {
    mockUsePostDetails.mockReturnValue({
      postDetails: { kind: 'collection' } as never,
      isLoading: false,
    });

    render(
      <TimelineFeedItem
        streamId={DEFAULT_STREAM_ID}
        postId={COLLECTION_POST_ID}
        index={0}
        totalCount={1}
        cardRef={cardRef}
        onPostKeyDown={onPostKeyDown}
      />,
    );

    expect(screen.getByTestId('collection-card-feed-item')).toBeInTheDocument();
    expect(screen.getByTestId('collection-card')).toHaveAttribute('data-author', 'author-pubky');
    expect(screen.getByTestId('collection-card')).toHaveAttribute('data-post-id', 'collection-post-id');
    expect(screen.queryByTestId('post-main')).not.toBeInTheDocument();
    expect(screen.queryByTestId('post-replies')).not.toBeInTheDocument();
  });

  it('renders CollectionCardSkeleton on collection streams while post details are loading', () => {
    mockUsePostDetails.mockReturnValue({
      postDetails: undefined,
      isLoading: true,
    });

    render(
      <TimelineFeedItem
        streamId={COLLECTION_STREAM_ID}
        postId={COLLECTION_POST_ID}
        index={0}
        totalCount={1}
        cardRef={cardRef}
        onPostKeyDown={onPostKeyDown}
      />,
    );

    expect(screen.getByTestId('collection-card-feed-item')).toBeInTheDocument();
    expect(screen.getByTestId('collection-card-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('post-main')).not.toBeInTheDocument();
    expect(screen.queryByTestId('collection-card')).not.toBeInTheDocument();
  });

  it('navigates to the collection page on Enter for collection feed items', () => {
    mockUsePostDetails.mockReturnValue({
      postDetails: { kind: 'collection' } as never,
      isLoading: false,
    });

    render(
      <TimelineFeedItem
        streamId={COLLECTION_STREAM_ID}
        postId={COLLECTION_POST_ID}
        index={0}
        totalCount={1}
        cardRef={cardRef}
        onPostKeyDown={onPostKeyDown}
      />,
    );

    fireEvent.keyDown(screen.getByTestId('collection-card-feed-item'), { key: 'Enter' });

    expect(mockPush).toHaveBeenCalledWith('/collections/author-pubky/collection-post-id');
    expect(onPostKeyDown).not.toHaveBeenCalled();
  });

  it('renders PostMain and replies for non-collection posts', () => {
    mockUsePostDetails.mockReturnValue({
      postDetails: { kind: 'short' } as never,
      isLoading: false,
    });

    render(
      <TimelineFeedItem
        streamId={DEFAULT_STREAM_ID}
        postId="author-pubky:post-id"
        index={0}
        totalCount={1}
        cardRef={cardRef}
        onPostKeyDown={onPostKeyDown}
      />,
    );

    expect(screen.getByTestId('post-card')).toBeInTheDocument();
    expect(screen.getByTestId('post-main')).toBeInTheDocument();
    expect(screen.getByTestId('post-replies')).toBeInTheDocument();
    expect(screen.queryByTestId('collection-card')).not.toBeInTheDocument();
  });

  it('delegates keyboard activation to post navigation for non-collection posts', () => {
    mockUsePostDetails.mockReturnValue({
      postDetails: { kind: 'short' } as never,
      isLoading: false,
    });

    render(
      <TimelineFeedItem
        streamId={DEFAULT_STREAM_ID}
        postId="author-pubky:post-id"
        index={0}
        totalCount={1}
        cardRef={cardRef}
        onPostKeyDown={onPostKeyDown}
      />,
    );

    fireEvent.keyDown(screen.getByTestId('post-card'), { key: 'Enter' });

    expect(onPostKeyDown).toHaveBeenCalledWith('author-pubky:post-id', expect.any(Object));
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('TimelineFeedItem - Snapshots', () => {
  const cardRef = vi.fn();
  const onPostKeyDown = vi.fn();

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as ReturnType<typeof useRouter>);
  });

  it('matches snapshot for a collection feed item', () => {
    mockUsePostDetails.mockReturnValue({
      postDetails: { kind: 'collection' } as never,
      isLoading: false,
    });

    const { container } = render(
      <TimelineFeedItem
        streamId={COLLECTION_STREAM_ID}
        postId={COLLECTION_POST_ID}
        index={0}
        totalCount={1}
        cardRef={cardRef}
        onPostKeyDown={onPostKeyDown}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for a regular post feed item', () => {
    mockUsePostDetails.mockReturnValue({
      postDetails: { kind: 'short' } as never,
      isLoading: false,
    });

    const { container } = render(
      <TimelineFeedItem
        streamId={DEFAULT_STREAM_ID}
        postId="author-pubky:post-id"
        index={1}
        totalCount={3}
        cardRef={cardRef}
        onPostKeyDown={onPostKeyDown}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot while post details are still loading on a non-collection stream', () => {
    mockUsePostDetails.mockReturnValue({
      postDetails: undefined,
      isLoading: true,
    });

    const { container } = render(
      <TimelineFeedItem
        streamId={DEFAULT_STREAM_ID}
        postId="author-pubky:post-id"
        index={0}
        totalCount={1}
        cardRef={cardRef}
        onPostKeyDown={onPostKeyDown}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot while post details are still loading on a collection stream', () => {
    mockUsePostDetails.mockReturnValue({
      postDetails: undefined,
      isLoading: true,
    });

    const { container } = render(
      <TimelineFeedItem
        streamId={COLLECTION_STREAM_ID}
        postId={COLLECTION_POST_ID}
        index={0}
        totalCount={1}
        cardRef={cardRef}
        onPostKeyDown={onPostKeyDown}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
