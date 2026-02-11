import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as Hooks from '@/hooks';
import { GroupedRepostHeader } from './GroupedRepostHeader';

// Fixed time for deterministic tests
const FIXED_NOW = new Date('2025-01-15T12:00:00Z');
const TWO_HOURS_AGO = FIXED_NOW.getTime() - 2 * 60 * 60 * 1000;

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      you: 'You',
      youAndOthersReposted: `${params?.name} and ${params?.count} others reposted this`,
      mobileReposted: `${params?.name}, others reposted`,
      singleReposted: `${params?.name} reposted`,
      reposters: 'Reposters',
    };
    return translations[key] || key;
  },
}));

// Mock atoms (custom components, not Radix UI)
vi.mock('@/atoms', () => ({
  Container: ({
    children,
    className,
    overrideDefaults,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    className?: string;
    overrideDefaults?: boolean;
    'data-testid'?: string;
  }) => (
    <div data-testid={dataTestId ?? 'container'} className={className} data-override-defaults={overrideDefaults}>
      {children}
    </div>
  ),
  Typography: ({
    children,
    className,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    className?: string;
    'data-testid'?: string;
  }) => (
    <span data-testid={dataTestId ?? 'typography'} className={className}>
      {children}
    </span>
  ),
  Button: ({
    children,
    className,
    onClick,
    overrideDefaults,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    overrideDefaults?: boolean;
    'data-testid'?: string;
    'aria-label'?: string;
  }) => (
    <button
      data-testid={dataTestId ?? 'button'}
      className={className}
      onClick={onClick}
      data-override-defaults={overrideDefaults}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
}));

// Mock molecules (tested separately)
vi.mock('@/molecules', () => ({
  AvatarGroup: ({
    items,
    totalCount,
    maxAvatars,
  }: {
    items: Array<{ id: string; name?: string; avatarUrl?: string }>;
    totalCount: number;
    maxAvatars?: number;
  }) => (
    <div data-testid="avatar-group" data-items={items.length} data-total={totalCount} data-max={maxAvatars}>
      Avatar Group ({items.length} avatars)
    </div>
  ),
}));

// Mock RepostersOverlay (tested separately)
vi.mock('./RepostersOverlay', () => ({
  RepostersOverlay: ({
    variant,
    open,
    reposterIds,
  }: {
    variant: 'dialog' | 'sheet';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reposterIds: string[];
    fallbackReposters?: Array<{ id: string }>;
  }) => (
    <div data-testid="reposters-overlay" data-variant={variant} data-open={open} data-count={reposterIds.length}>
      RepostersOverlay ({variant})
    </div>
  ),
}));

// Use real @/libs (icons, formatPublicKey, cn) per testing guidelines
vi.mock('@/libs', async () => {
  const actual = await vi.importActual('@/libs');
  return {
    ...actual,
  };
});

// Mock hooks (data fetching)
const mockProfile = { name: 'Alice' };
const mockUsers = [
  { id: 'user1', name: 'Alice', avatarUrl: 'https://example.com/alice.jpg' },
  { id: 'user2', name: 'Bob', avatarUrl: 'https://example.com/bob.jpg' },
  { id: 'user3', name: 'Charlie', avatarUrl: 'https://example.com/charlie.jpg' },
];

let mockIsMobile = false;

vi.mock('@/hooks', () => ({
  useUserProfile: vi.fn(() => ({
    profile: mockProfile,
    isLoading: false,
  })),
  useUserDetailsFromIds: vi.fn(() => ({
    users: mockUsers,
    isLoading: false,
  })),
  useRelativeTime: vi.fn(() => ({
    formatRelativeTime: () => '2h',
  })),
  useIsMobile: vi.fn(() => mockIsMobile),
}));

describe('GroupedRepostHeader', () => {
  const defaultProps = {
    reposterIds: ['user1', 'user2', 'user3'],
    includesCurrentUser: false,
    earliestTimestamp: TWO_HOURS_AGO,
    isExpanded: false,
    onExpandToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.clearAllMocks();
    mockIsMobile = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the header with repeat icon', () => {
    const { container } = render(<GroupedRepostHeader {...defaultProps} />);

    expect(screen.getByTestId('grouped-repost-header')).toBeInTheDocument();
    expect(container.querySelector('svg.lucide-repeat')).toBeInTheDocument();
  });

  it('shows first reposter name and others count', () => {
    render(<GroupedRepostHeader {...defaultProps} />);

    const header = screen.getByTestId('grouped-repost-header');
    expect(header).toHaveTextContent('Alice');
    expect(header).toHaveTextContent('2 others');
    expect(header).toHaveTextContent('reposted');
  });

  it('shows "You" when current user has reposted', () => {
    render(<GroupedRepostHeader {...defaultProps} includesCurrentUser={true} />);

    const header = screen.getByTestId('grouped-repost-header');
    expect(header).toHaveTextContent('You');
    expect(header).toHaveTextContent('2 others');
  });

  it('renders AvatarGroup with maxAvatars=4', () => {
    render(<GroupedRepostHeader {...defaultProps} />);

    const avatarGroup = screen.getByTestId('avatar-group');
    expect(avatarGroup).toBeInTheDocument();
    expect(avatarGroup).toHaveAttribute('data-max', '4');
  });

  it('calls onExpandToggle when clicking the trigger button', () => {
    const onExpandToggle = vi.fn();
    render(<GroupedRepostHeader {...defaultProps} onExpandToggle={onExpandToggle} />);

    fireEvent.click(screen.getByTestId('grouped-repost-text'));
    expect(onExpandToggle).toHaveBeenCalledTimes(1);
  });

  it('renders RepostersOverlay with dialog variant on desktop when expanded', () => {
    mockIsMobile = false;
    render(<GroupedRepostHeader {...defaultProps} isExpanded={true} />);

    const overlay = screen.getByTestId('reposters-overlay');
    expect(overlay).toHaveAttribute('data-variant', 'dialog');
    expect(overlay).toHaveAttribute('data-open', 'true');
  });

  it('renders RepostersOverlay with sheet variant on mobile when expanded', () => {
    mockIsMobile = true;
    render(<GroupedRepostHeader {...defaultProps} isExpanded={true} />);

    const overlay = screen.getByTestId('reposters-overlay');
    expect(overlay).toHaveAttribute('data-variant', 'sheet');
    expect(overlay).toHaveAttribute('data-open', 'true');
  });

  it('does not render RepostersOverlay when collapsed', () => {
    render(<GroupedRepostHeader {...defaultProps} isExpanded={false} />);

    expect(screen.queryByTestId('reposters-overlay')).not.toBeInTheDocument();
  });

  it('toggles RepostersOverlay when expanding from collapsed', () => {
    const { rerender } = render(<GroupedRepostHeader {...defaultProps} isExpanded={false} />);

    expect(screen.queryByTestId('reposters-overlay')).not.toBeInTheDocument();

    rerender(<GroupedRepostHeader {...defaultProps} isExpanded={true} />);
    expect(screen.getByTestId('reposters-overlay')).toHaveAttribute('data-open', 'true');
  });

  it('renders timestamp', () => {
    render(<GroupedRepostHeader {...defaultProps} />);

    expect(screen.getByTestId('grouped-repost-header')).toHaveTextContent('2h');
  });

  it('shows single reposter format when only one reposter', () => {
    render(<GroupedRepostHeader {...defaultProps} reposterIds={['user1']} />);

    const text = screen.getByTestId('grouped-repost-text');
    expect(text).toHaveTextContent('Alice');
    expect(text).toHaveTextContent('reposted');
  });

  it('does not render overlay for single reposter even when expanded', () => {
    render(<GroupedRepostHeader {...defaultProps} reposterIds={['user1']} isExpanded={true} />);

    expect(screen.queryByTestId('reposters-overlay')).not.toBeInTheDocument();
  });

  it('renders overlay when expanded even when reposterUsers is empty (e.g. failed to load)', () => {
    vi.mocked(Hooks.useUserDetailsFromIds).mockReturnValueOnce({ users: [], isLoading: false });

    render(<GroupedRepostHeader {...defaultProps} isExpanded={true} />);

    const overlay = screen.getByTestId('reposters-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute('data-open', 'true');
  });

  it('renders loading skeleton when profile is loading', () => {
    vi.mocked(Hooks.useUserProfile).mockReturnValueOnce({ profile: null, isLoading: true });

    render(<GroupedRepostHeader {...defaultProps} />);

    const header = screen.getByTestId('grouped-repost-header');
    expect(header.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

describe('GroupedRepostHeader - Snapshots', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.clearAllMocks();
    mockIsMobile = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches snapshot with multiple reposters collapsed', () => {
    const { container } = render(
      <GroupedRepostHeader
        reposterIds={['user1', 'user2', 'user3']}
        includesCurrentUser={false}
        earliestTimestamp={TWO_HOURS_AGO}
        isExpanded={false}
        onExpandToggle={vi.fn()}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with multiple reposters expanded', () => {
    const { container } = render(
      <GroupedRepostHeader
        reposterIds={['user1', 'user2', 'user3']}
        includesCurrentUser={false}
        earliestTimestamp={TWO_HOURS_AGO}
        isExpanded={true}
        onExpandToggle={vi.fn()}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with single reposter', () => {
    const { container } = render(
      <GroupedRepostHeader
        reposterIds={['user1']}
        includesCurrentUser={false}
        earliestTimestamp={TWO_HOURS_AGO}
        isExpanded={false}
        onExpandToggle={vi.fn()}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with current user included', () => {
    const { container } = render(
      <GroupedRepostHeader
        reposterIds={['user1', 'user2']}
        includesCurrentUser={true}
        earliestTimestamp={TWO_HOURS_AGO}
        isExpanded={false}
        onExpandToggle={vi.fn()}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
