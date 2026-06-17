import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnrichedPostDetails } from '@/application/moderation/moderation.types';
import { usePostDetails } from '@/hooks/usePostDetails/usePostDetails';
import { asOpaque } from '@/test-utils/type-assertions';
import { CollectionItems } from './CollectionItems';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseAuthStore = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => `${namespace ?? ''}.${key}`,
  useFormatter: () => ({
    number: (value: number, _options?: Intl.NumberFormatOptions) => String(value),
  }),
}));

vi.mock('@/hooks/usePostDetails/usePostDetails', () => ({
  usePostDetails: vi.fn(),
}));

vi.mock('@/stores/auth/auth.store', () => ({
  useAuthStore: (selector: (state: { currentUserPubky: string | null }) => unknown) => mockUseAuthStore(selector),
}));

// Expose whether a custom empty state was forwarded (the regression fix) via a
// data attribute; the real feed only renders it when the stream is empty, so the
// mock mirrors that by not rendering the slot content unconditionally.
vi.mock('@/organisms/Timeline/Feed/TimelineFeed/TimelineFeed', () => ({
  TimelineFeed: ({
    variant,
    children,
    emptyState,
  }: {
    variant: string;
    children?: ReactNode;
    emptyState?: ReactNode;
  }) => (
    <div data-testid="timeline-feed" data-variant={variant} data-has-empty-state={emptyState ? 'true' : 'false'}>
      {children}
    </div>
  ),
}));

// The dialog's trigger button and optimistic append wiring live inside
// AddContentDialog now, so here we only assert it is rendered and targeted.
vi.mock('@/organisms/AddContentDialog/AddContentDialog', () => ({
  AddContentDialog: ({ target }: { target: { kind: string; collectionId?: string; collectionName?: string } }) => (
    <div
      data-testid="add-content-dialog"
      data-target-kind={target.kind}
      data-collection-id={target.collectionId}
      data-collection-name={target.collectionName}
    />
  ),
}));

// ---------------------------------------------------------------------------
// Fixtures + helpers
// ---------------------------------------------------------------------------

const AUTHOR_PUBKY = 'o1gg96ewuojmopcjbz8895478wdtxtzzber7aezq6ror5a91j7dy';
const POST_ID = '0034BBBDFK83G';
const COMPOSITE_ID = `${AUTHOR_PUBKY}:${POST_ID}`;

const COLLECTION_CONTENT = JSON.stringify({
  name: 'Based Bitcoin',
  description: 'A bit of Bitcoin purity amidst all of the madness.',
  items: ['pubky://author/pub/pubky.app/posts/a', 'pubky://author/pub/pubky.app/posts/b'],
});

const COLLECTION_CONTENT_EMPTY = JSON.stringify({
  name: 'Quiet collection',
  description: null,
  items: [],
});

const mockUsePostDetails = vi.mocked(usePostDetails);

function setAuthStore(currentUserPubky: string | null) {
  mockUseAuthStore.mockImplementation((selector: (state: { currentUserPubky: string | null }) => unknown) =>
    selector({ currentUserPubky }),
  );
}

function setPostDetails(content: string | null) {
  mockUsePostDetails.mockReturnValue({
    postDetails: content
      ? asOpaque<EnrichedPostDetails>({
          id: COMPOSITE_ID,
          content,
          kind: 'collection',
          indexed_at: 0,
          uri: '',
          attachments: null,
          is_moderated: false,
          is_blurred: false,
        })
      : null,
    isLoading: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuthStore(null);
  setPostDetails(COLLECTION_CONTENT);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CollectionItems', () => {
  it('renders the COLLECTION TimelineFeed for a non-empty envelope and no empty state', () => {
    setPostDetails(COLLECTION_CONTENT);

    render(<CollectionItems authorPubky={AUTHOR_PUBKY} postId={POST_ID} />);

    const feed = screen.getByTestId('timeline-feed');
    expect(feed).toHaveAttribute('data-variant', 'collection');
    expect(feed).toHaveAttribute('data-has-empty-state', 'false');
    expect(screen.queryByTestId('collection-items-empty')).not.toBeInTheDocument();
  });

  it('renders the owner Add Content CTA dialog above the feed for a non-empty envelope', () => {
    setAuthStore(AUTHOR_PUBKY);
    setPostDetails(COLLECTION_CONTENT);

    render(<CollectionItems authorPubky={AUTHOR_PUBKY} postId={POST_ID} />);

    expect(screen.getByTestId('timeline-feed')).toHaveAttribute('data-variant', 'collection');
    expect(screen.getByTestId('add-content-dialog')).toHaveAttribute('data-target-kind', 'collection');
    expect(screen.getByTestId('add-content-dialog')).toHaveAttribute('data-collection-id', COMPOSITE_ID);
    expect(screen.getByTestId('add-content-dialog')).toHaveAttribute('data-collection-name', 'Based Bitcoin');
  });

  it('forwards the shared empty state to the owner feed so an empty collection avoids "No posts found"', () => {
    setAuthStore(AUTHOR_PUBKY);
    setPostDetails(COLLECTION_CONTENT_EMPTY);

    render(<CollectionItems authorPubky={AUTHOR_PUBKY} postId={POST_ID} />);

    expect(screen.getByTestId('timeline-feed')).toHaveAttribute('data-has-empty-state', 'true');
  });

  it('does not render the Add Content CTA dialog for non-owner populated collections', () => {
    setAuthStore('some-other-user');
    setPostDetails(COLLECTION_CONTENT);

    render(<CollectionItems authorPubky={AUTHOR_PUBKY} postId={POST_ID} />);

    expect(screen.getByTestId('timeline-feed')).toHaveAttribute('data-variant', 'collection');
    expect(screen.queryByTestId('add-content-dialog')).not.toBeInTheDocument();
  });

  it('renders the feed (never the empty state) while the envelope is still loading', () => {
    mockUsePostDetails.mockReturnValue({ postDetails: undefined, isLoading: true });

    render(<CollectionItems authorPubky={AUTHOR_PUBKY} postId={POST_ID} />);

    expect(screen.getByTestId('timeline-feed')).toHaveAttribute('data-variant', 'collection');
    expect(screen.queryByTestId('collection-items-empty')).not.toBeInTheDocument();
  });

  it('renders the owner Add Content CTA dialog inside the feed for an empty envelope owned by the viewer', () => {
    setAuthStore(AUTHOR_PUBKY);
    setPostDetails(COLLECTION_CONTENT_EMPTY);

    render(<CollectionItems authorPubky={AUTHOR_PUBKY} postId={POST_ID} />);

    expect(screen.getByTestId('add-content-dialog')).toHaveAttribute('data-target-kind', 'collection');
    expect(screen.getByTestId('add-content-dialog')).toHaveAttribute('data-collection-id', COMPOSITE_ID);
    expect(screen.getByTestId('add-content-dialog')).toHaveAttribute('data-collection-name', 'Quiet collection');
    const feed = screen.getByTestId('timeline-feed');
    expect(feed).toHaveAttribute('data-variant', 'collection');
    expect(feed).toHaveAttribute('data-has-empty-state', 'true');
  });

  it('renders plain empty text (and no Add Content CTA) for an empty envelope viewed by a non-owner', () => {
    setAuthStore('some-other-user');
    setPostDetails(COLLECTION_CONTENT_EMPTY);

    render(<CollectionItems authorPubky={AUTHOR_PUBKY} postId={POST_ID} />);

    expect(screen.getByText('collections.single.empty')).toBeInTheDocument();
    expect(screen.queryByTestId('add-content-dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('timeline-feed')).not.toBeInTheDocument();
  });
});
