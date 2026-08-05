import { fireEvent, render, screen } from '@testing-library/react';
import { PubkyAppFeedLayout, PubkyAppFeedReach, PubkyAppFeedSort } from 'pubky-app-specs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FeedModelSchema } from '@/models/feed/feed.schema';
import { resetViewport, setMobileViewport } from '@/test-utils/viewport';
import { FeedNavigation } from './FeedNavigation';

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock dexie-react-hooks — allow controlling useLiveQuery return value per test
let mockCustomFeeds: FeedModelSchema[];
let mockIsAuthenticated = true;
let mockViewport: 'small' | 'medium' | 'large' = 'large';
const mockRequireAuth = vi.fn((action: () => unknown) => action());
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(
    (queryFn: () => Promise<FeedModelSchema[]>, _deps?: unknown[], defaultResult?: FeedModelSchema[]) => {
      // Execute the query function so error-path tests can verify Logger calls
      void queryFn().catch(() => {});
      return mockIsAuthenticated ? mockCustomFeeds : (defaultResult ?? []);
    },
  ),
}));

// Mock feed controller
const mockGetList = vi.fn();
vi.mock('@/controllers/feed/feed', () => ({
  FeedController: {
    getList: (...args: unknown[]) => mockGetList(...args),
  },
}));

// Mock @/atoms — lightweight forwarding mocks
vi.mock('@/atoms/Button/Button', () => {
  return {
    Button: ({
      children,
      variant,
      size,
      className,
      overrideDefaults,
      onClick,
      type,
      'aria-label': ariaLabel,
      'data-testid': dataTestId,
    }: {
      children: React.ReactNode;
      variant?: string;
      size?: string;
      className?: string;
      overrideDefaults?: boolean;
      onClick?: React.MouseEventHandler<HTMLButtonElement>;
      type?: 'button' | 'submit' | 'reset';
      'aria-label'?: string;
      'data-testid'?: string;
    }) => (
      <button
        data-testid={dataTestId ?? 'button'}
        data-variant={variant}
        data-size={size}
        className={className}
        data-override-defaults={overrideDefaults}
        onClick={onClick}
        type={type}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    ),
  };
});

vi.mock('@/atoms/Container/Container', () => {
  return {
    Container: ({
      children,
      className,
      overrideDefaults: _overrideDefaults,
      'data-testid': dataTestId,
    }: {
      children: React.ReactNode;
      className?: string;
      overrideDefaults?: boolean;
      'data-testid'?: string;
    }) => (
      <div data-testid={dataTestId ?? 'container'} className={className}>
        {children}
      </div>
    ),
  };
});

vi.mock('@/atoms/Heading/Heading', () => {
  return {
    Heading: ({
      children,
      level,
      size,
      className,
    }: {
      children: React.ReactNode;
      level?: number;
      size?: string;
      className?: string;
    }) => (
      <div data-testid="heading" data-level={level} data-size={size} className={className}>
        {children}
      </div>
    ),
  };
});

vi.mock('@/atoms/Link/Link', () => {
  return {
    Link: ({
      children,
      href,
      className,
      overrideDefaults,
      onClick,
      'aria-current': ariaCurrent,
    }: {
      children: React.ReactNode;
      href?: string;
      className?: string;
      overrideDefaults?: boolean;
      onClick?: React.MouseEventHandler<HTMLAnchorElement>;
      'aria-current'?: React.AriaAttributes['aria-current'];
    }) => (
      <a
        data-testid="link"
        href={href}
        className={className}
        data-override-defaults={overrideDefaults}
        onClick={onClick}
        aria-current={ariaCurrent}
      >
        {children}
      </a>
    ),
  };
});

vi.mock('@/atoms/Typography/Typography', () => {
  return {
    Typography: ({
      children,
      className,
      overrideDefaults,
    }: {
      children: React.ReactNode;
      className?: string;
      overrideDefaults?: boolean;
    }) => (
      <span data-testid="typography" className={className} data-override-defaults={overrideDefaults}>
        {children}
      </span>
    ),
  };
});

// Mock @/organisms — CustomFeedDialog is a complex component; mock it as a transparent wrapper
vi.mock('@/organisms/CustomFeedDialog/CustomFeedDialog', () => {
  return {
    CustomFeedDialog: ({
      children,
      mode,
      feed,
    }: {
      children: React.ReactNode;
      mode: string;
      feed?: FeedModelSchema;
    }) => (
      <div data-testid={`custom-feed-dialog-${mode}`} data-feed-id={feed?.id}>
        {children}
      </div>
    ),
  };
});

// Mock @/app/routes
vi.mock('@/app/routes', () => ({
  APP_ROUTES: {
    HOME: '/home',
    FEED: '/feed',
  },
}));

vi.mock('@/hooks/useRequireAuth/useRequireAuth', () => ({
  useRequireAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    requireAuth: mockRequireAuth,
  }),
}));

vi.mock('@/hooks/useIsMobile/useIsMobile', () => ({
  useIsMobile: ({ breakpoint }: { breakpoint?: string } = {}) => {
    if (breakpoint === 'lg') return mockViewport === 'small';
    if (breakpoint === 'xl') return mockViewport !== 'large';
    return mockViewport !== 'large';
  },
}));

vi.mock('@/hooks/useIsTouchDevice/useIsTouchDevice', () => ({
  useIsTouchDevice: () => false,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createMockFeed = (overrides: Partial<FeedModelSchema> = {}): FeedModelSchema => ({
  id: 'feed-abc123',
  name: 'Bitcoin News',
  icon: 'activity',
  tags: ['bitcoin', 'lightning'],
  reach: PubkyAppFeedReach.All,
  sort: PubkyAppFeedSort.Recent,
  content: null,
  layout: PubkyAppFeedLayout.Columns,
  created_at: Date.now(),
  updated_at: Date.now(),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FeedNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCustomFeeds = [];
    mockIsAuthenticated = true;
    mockViewport = 'large';
    mockRequireAuth.mockImplementation((action: () => unknown) => action());
    mockUsePathname.mockReturnValue('/home');
    mockGetList.mockResolvedValue([]);
  });

  // ── Sanity ───────────────────────────────────────────────────────────────

  it('renders with default state (no custom feeds)', () => {
    render(<FeedNavigation />);

    const container = screen.getByTestId('container');
    expect(container).toBeInTheDocument();

    // Home link should always be present
    expect(screen.getByText('Home')).toBeInTheDocument();

    // Create Feed button should always be present
    expect(screen.getByText('Create Feed')).toBeInTheDocument();
  });

  // ── Home feed link ──────────────────────────────────────────────────────

  it('renders the Home feed link with correct href', () => {
    render(<FeedNavigation />);

    const links = screen.getAllByTestId('link');
    const homeLink = links.find((link) => link.getAttribute('href') === '/home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveTextContent('Home');
  });

  it('applies active styling to Home link when pathname is /home', () => {
    mockUsePathname.mockReturnValue('/home');
    render(<FeedNavigation />);

    const links = screen.getAllByTestId('link');
    const homeLink = links.find((link) => link.getAttribute('href') === '/home');
    expect(homeLink).toHaveClass('border-white');
    expect(homeLink).toHaveClass('text-white');
  });

  it('applies muted styling to Home link when pathname is not /home', () => {
    mockUsePathname.mockReturnValue('/feed/feed-abc123');
    render(<FeedNavigation />);

    const links = screen.getAllByTestId('link');
    const homeLink = links.find((link) => link.getAttribute('href') === '/home');
    expect(homeLink).toHaveClass('border-border');
    expect(homeLink).toHaveClass('text-muted-foreground');
  });

  // ── Custom feeds rendering ──────────────────────────────────────────────

  it('renders custom feeds from useLiveQuery', () => {
    mockCustomFeeds = [
      createMockFeed({ id: 'feed-1', name: 'Bitcoin News' }),
      createMockFeed({ id: 'feed-2', name: 'Lightning Network' }),
    ];

    render(<FeedNavigation />);

    expect(screen.getByText('Bitcoin News')).toBeInTheDocument();
    expect(screen.getByText('Lightning Network')).toBeInTheDocument();
  });

  it('renders custom feed links with correct href based on feed id', () => {
    mockCustomFeeds = [createMockFeed({ id: 'feed-xyz', name: 'My Feed' })];

    render(<FeedNavigation />);

    const links = screen.getAllByTestId('link');
    const customFeedLink = links.find((link) => link.getAttribute('href') === '/feed/feed-xyz');
    expect(customFeedLink).toBeInTheDocument();
    expect(customFeedLink).toHaveTextContent('My Feed');
  });

  it('renders multiple custom feeds in order', () => {
    mockCustomFeeds = [
      createMockFeed({ id: 'feed-a', name: 'Alpha Feed' }),
      createMockFeed({ id: 'feed-b', name: 'Beta Feed' }),
      createMockFeed({ id: 'feed-c', name: 'Gamma Feed' }),
    ];

    render(<FeedNavigation />);

    const typographies = screen.getAllByTestId('typography');
    const feedNames = typographies.map((t) => t.textContent);

    // Home is first, then custom feeds, then Create Feed
    expect(feedNames).toEqual(['Home', 'Alpha Feed', 'Beta Feed', 'Gamma Feed', 'Create Feed']);
  });

  // ── Active / Inactive custom feed styling ───────────────────────────────

  it('applies active styling to a custom feed when its route matches pathname', () => {
    mockCustomFeeds = [createMockFeed({ id: 'feed-active', name: 'Active Feed' })];
    mockUsePathname.mockReturnValue('/feed/feed-active');

    render(<FeedNavigation />);

    const links = screen.getAllByTestId('link');
    const activeLink = links.find((link) => link.getAttribute('href') === '/feed/feed-active');
    expect(activeLink?.parentElement).toHaveClass('border-white');
    expect(activeLink).toHaveClass('text-white');
  });

  it('applies muted styling to a custom feed when its route does not match pathname', () => {
    mockCustomFeeds = [createMockFeed({ id: 'feed-inactive', name: 'Inactive Feed' })];
    mockUsePathname.mockReturnValue('/home');

    render(<FeedNavigation />);

    const links = screen.getAllByTestId('link');
    const inactiveLink = links.find((link) => link.getAttribute('href') === '/feed/feed-inactive');
    expect(inactiveLink?.parentElement).toHaveClass('border-border');
    expect(inactiveLink).toHaveClass('text-muted-foreground');
  });

  // ── Edit dialog for custom feeds ────────────────────────────────────────

  it('renders a separate edit action for an active custom feed', () => {
    mockCustomFeeds = [createMockFeed({ id: 'feed-edit', name: 'Editable Feed' })];
    mockUsePathname.mockReturnValue('/feed/feed-edit');

    render(<FeedNavigation />);

    const editDialog = screen.getByTestId('custom-feed-dialog-edit');
    expect(editDialog).toBeInTheDocument();
    expect(editDialog).toHaveAttribute('data-feed-id', 'feed-edit');

    const editButton = screen.getByTestId('edit-feed-feed-edit');
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveAttribute('aria-label', 'Edit Editable Feed');
    expect(editButton).toHaveClass('shrink-0');
    expect(editButton).not.toHaveClass('absolute');
  });

  it('renders an edit action for an inactive custom feed without nesting it in the link', () => {
    mockCustomFeeds = [createMockFeed({ id: 'feed-noedit', name: 'No Edit Feed' })];
    mockUsePathname.mockReturnValue('/home');

    render(<FeedNavigation />);

    const editDialog = screen.getByTestId('custom-feed-dialog-edit');
    const editButton = screen.getByTestId('edit-feed-feed-noedit');
    const feedLink = screen.getAllByTestId('link').find((link) => link.getAttribute('href') === '/feed/feed-noedit');

    expect(editDialog).toHaveAttribute('data-feed-id', 'feed-noedit');
    expect(editButton.closest('a')).toBeNull();
    expect(editDialog.parentElement).toBe(feedLink?.parentElement);
  });

  it('shows the edit action on mobile and reveals it on desktop hover or focus', () => {
    mockCustomFeeds = [createMockFeed({ id: 'feed-edit', name: 'Editable Feed' })];

    render(<FeedNavigation />);

    const editButton = screen.getByTestId('edit-feed-feed-edit');
    const feedLink = screen.getAllByTestId('link').find((link) => link.getAttribute('href') === '/feed/feed-edit');
    const feedTab = feedLink?.parentElement;
    expect(editButton).toHaveClass('opacity-100');
    expect(editButton).toHaveClass('lg:opacity-0');
    expect(editButton).toHaveClass('lg:group-hover:opacity-100');
    expect(editButton).toHaveClass('lg:group-focus-within:opacity-100');
    expect(editButton).toHaveClass('rounded-none');
    expect(editButton).toHaveClass('bg-transparent');
    expect(editButton).toHaveClass('hover:bg-transparent');
    expect(editButton).toHaveClass('transition-opacity');
    expect(editButton).toHaveClass('duration-200');
    expect(editButton.parentElement?.parentElement).toHaveClass('gap-x-2');
    expect(editButton).not.toHaveClass('mr-2');
    expect(editButton.querySelector('svg')).toHaveClass('size-2.5');
    expect(feedLink).toHaveClass('flex-1');
    expect(feedLink).toHaveClass('lg:flex-none');
    expect(feedTab).not.toHaveClass('justify-center');
    expect(feedTab).toHaveClass('lg:justify-center');
  });

  it('does not show edit dialog for Home feed even when active', () => {
    mockUsePathname.mockReturnValue('/home');

    render(<FeedNavigation />);

    expect(screen.queryByTestId('custom-feed-dialog-edit')).not.toBeInTheDocument();
  });

  it('renders a fallback icon for a legacy custom feed without an icon', () => {
    mockCustomFeeds = [createMockFeed({ id: 'legacy-feed', icon: undefined })];

    render(<FeedNavigation />);

    const legacyLink = screen.getAllByTestId('link').find((link) => link.getAttribute('href') === '/feed/legacy-feed');
    expect(legacyLink?.querySelector('svg')).toHaveClass('lucide-activity');
  });

  // ── Create Feed button ──────────────────────────────────────────────────

  it('renders Create Feed button inside a create dialog', () => {
    render(<FeedNavigation />);

    const createDialog = screen.getByTestId('custom-feed-dialog-create');
    expect(createDialog).toBeInTheDocument();
    expect(createDialog).toHaveTextContent('Create Feed');
  });

  it('shows Create Feed label on mobile and keeps it screen-reader only on desktop', () => {
    render(<FeedNavigation />);

    const createLabel = screen.getByText('Create Feed');
    expect(createLabel).toHaveClass('font-medium');
    expect(createLabel).toHaveClass('lg:sr-only');
  });

  it('keeps Create Feed button outside the feed tabs', () => {
    render(<FeedNavigation />);

    const createDialog = screen.getByTestId('custom-feed-dialog-create');
    const tabs = screen.getByTestId('feed-navigation-tabs');
    const createButton = createDialog.querySelector('button');

    expect(createButton).toHaveClass('shrink-0');
    expect(tabs.contains(createDialog)).toBe(false);
  });

  it('shows at most five feeds on large screens and puts the rest in a popover', () => {
    mockCustomFeeds = Array.from({ length: 6 }, (_, index) =>
      createMockFeed({ id: `feed-${index + 1}`, name: `Feed ${index + 1}` }),
    );

    render(<FeedNavigation />);

    expect(screen.getAllByTestId('custom-feed-tab')).toHaveLength(4);
    expect(screen.getByText('Feed 4')).toBeInTheDocument();
    expect(screen.queryByText('Feed 5')).not.toBeInTheDocument();
    const overflowTrigger = screen.getByTestId('feed-navigation-overflow-trigger');
    expect(overflowTrigger).toHaveAttribute('aria-label', 'More feeds');
    expect(overflowTrigger.querySelector('svg')).toHaveClass('lucide-chevrons-right');

    fireEvent.click(overflowTrigger);

    const overflowItems = screen.getAllByTestId('overflow-feed-item');
    expect(screen.getByTestId('popover-content')).toHaveClass('w-42');
    expect(overflowItems).toHaveLength(2);
    overflowItems.forEach((item) => expect(item).not.toHaveClass('border-b'));
    overflowItems.forEach((item) => expect(item.querySelector('a')).toHaveClass('flex-1'));
    expect(screen.getByTestId('edit-feed-feed-5')).toBeInTheDocument();
    expect(screen.getByTestId('edit-feed-feed-6')).toBeInTheDocument();
    expect(overflowItems[0].querySelector('a svg')).toHaveClass('size-4');
    expect(screen.getByTestId('edit-feed-feed-5').querySelector('svg')).toHaveClass('size-2.5');
    expect(screen.getByTestId('edit-feed-feed-5').closest('a')).toBeNull();
    expect(screen.getByText('Feed 5')).toBeInTheDocument();
    expect(screen.getByText('Feed 6')).toBeInTheDocument();
  });

  it('limits desktop rows but renders every feed in the mobile drawer', () => {
    mockCustomFeeds = Array.from({ length: 5 }, (_, index) =>
      createMockFeed({ id: `feed-${index + 1}`, name: `Feed ${index + 1}` }),
    );
    mockViewport = 'medium';

    const { rerender } = render(<FeedNavigation />);

    expect(screen.getAllByTestId('custom-feed-tab')).toHaveLength(3);

    mockViewport = 'small';
    rerender(<FeedNavigation />);

    expect(screen.getAllByTestId('custom-feed-tab')).toHaveLength(5);
    expect(screen.queryByTestId('feed-navigation-overflow-trigger')).not.toBeInTheDocument();
  });

  it('keeps a selected overflow feed visible with its edit action', () => {
    mockCustomFeeds = Array.from({ length: 5 }, (_, index) =>
      createMockFeed({ id: `feed-${index + 1}`, name: `Feed ${index + 1}` }),
    );
    mockUsePathname.mockReturnValue('/feed/feed-5');

    render(<FeedNavigation />);

    const activeLink = screen.getAllByTestId('link').find((link) => link.getAttribute('href') === '/feed/feed-5');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(activeLink?.parentElement).toHaveClass('border-white');
    expect(screen.getByTestId('edit-feed-feed-5')).toBeInTheDocument();
    expect(screen.queryByText('Feed 4')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('feed-navigation-overflow-trigger'));

    expect(screen.getByText('Feed 4')).toBeInTheDocument();
  });

  it('renders Create Feed button with PlusCircle icon', () => {
    render(<FeedNavigation />);

    const createDialog = screen.getByTestId('custom-feed-dialog-create');
    const svg = createDialog.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('does not expose custom feeds when unauthenticated', () => {
    mockIsAuthenticated = false;
    mockCustomFeeds = [createMockFeed({ id: 'feed-1', name: 'Private Feed' })];

    render(<FeedNavigation />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Private Feed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('custom-feed-dialog-create')).not.toBeInTheDocument();
    expect(mockGetList).not.toHaveBeenCalled();
  });

  it('opens sign-in dialog when unauthenticated user clicks Create Feed', () => {
    mockIsAuthenticated = false;
    mockRequireAuth.mockReturnValue(undefined);

    render(<FeedNavigation />);

    fireEvent.click(screen.getByText('Create Feed'));

    expect(mockRequireAuth).toHaveBeenCalledTimes(1);
  });

  // ── Error handling ──────────────────────────────────────────────────────

  it('renders empty feed list when getList rejects (error handled in useLiveQuery callback)', async () => {
    mockGetList.mockRejectedValue(new Error('Database error'));
    mockCustomFeeds = [];

    render(<FeedNavigation />);

    // Should still render Home and Create Feed even when getList fails
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Create Feed')).toBeInTheDocument();
  });

  // ── Container and layout ────────────────────────────────────────────────

  it('renders a clipped tab region without scrolling or a scroll fade', () => {
    render(<FeedNavigation />);

    const container = screen.getByTestId('container');
    const tabs = screen.getByTestId('feed-navigation-tabs');
    expect(container).toHaveClass('lg:flex-row');
    expect(container).toHaveClass('overflow-hidden');
    expect(tabs).toHaveClass('overflow-hidden');
    expect(tabs).not.toHaveClass('overflow-x-auto');
    expect(tabs).not.toHaveClass('scroll-fade-s');
    expect(tabs).toHaveClass('min-w-0');
    expect(tabs).toHaveClass('flex-1');
  });

  it('renders all links with min-w-0 and h-12 classes', () => {
    mockCustomFeeds = [createMockFeed({ id: 'feed-1', name: 'Test Feed' })];
    render(<FeedNavigation />);

    const links = screen.getAllByTestId('link');
    links.forEach((link) => {
      expect(link).toHaveClass('min-w-0');
      expect(link).toHaveClass('min-h-12');
    });
  });
});

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------

describe('FeedNavigation - Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCustomFeeds = [];
    mockIsAuthenticated = true;
    mockViewport = 'large';
    mockRequireAuth.mockImplementation((action: () => unknown) => action());
    mockUsePathname.mockReturnValue('/home');
    mockGetList.mockResolvedValue([]);
  });

  it('matches snapshot with no custom feeds and Home active', () => {
    const { container } = render(<FeedNavigation />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with the large-screen feed limit', () => {
    mockCustomFeeds = Array.from({ length: 4 }, (_, index) =>
      createMockFeed({ id: `feed-${index + 1}`, name: `Feed ${index + 1}` }),
    );

    const { container } = render(<FeedNavigation />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with custom feeds and Home active', () => {
    mockCustomFeeds = [
      createMockFeed({ id: 'feed-1', name: 'Bitcoin News' }),
      createMockFeed({ id: 'feed-2', name: 'Lightning Network' }),
    ];

    const { container } = render(<FeedNavigation />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with custom feed active (showing edit dialog)', () => {
    mockCustomFeeds = [createMockFeed({ id: 'feed-active', name: 'Active Feed' })];
    mockUsePathname.mockReturnValue('/feed/feed-active');

    const { container } = render(<FeedNavigation />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with multiple custom feeds and one active', () => {
    mockCustomFeeds = [
      createMockFeed({ id: 'feed-1', name: 'Bitcoin' }),
      createMockFeed({ id: 'feed-2', name: 'Lightning' }),
      createMockFeed({ id: 'feed-3', name: 'Nostr' }),
    ];
    mockUsePathname.mockReturnValue('/feed/feed-2');

    const { container } = render(<FeedNavigation />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('FeedNavigation - Mobile Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCustomFeeds = Array.from({ length: 4 }, (_, index) =>
      createMockFeed({ id: `feed-${index + 1}`, name: `Feed ${index + 1}` }),
    );
    mockIsAuthenticated = true;
    mockViewport = 'small';
    mockRequireAuth.mockImplementation((action: () => unknown) => action());
    mockUsePathname.mockReturnValue('/home');
    mockGetList.mockResolvedValue([]);
    setMobileViewport();
  });

  afterEach(() => {
    resetViewport();
  });

  it('matches snapshot with all feeds in the mobile drawer', () => {
    const { container } = render(<FeedNavigation />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
