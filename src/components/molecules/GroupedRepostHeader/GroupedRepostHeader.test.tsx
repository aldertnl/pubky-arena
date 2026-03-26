import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupedRepostHeader } from './GroupedRepostHeader';

let mockCurrentUserPubky: string | null = null;

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      repostedByOne: `${params?.name} reposted this`,
      repostedByTwo: `${params?.name1} and ${params?.name2} reposted this`,
      repostedByMany: `${params?.name} and ${params?.count} others reposted this`,
      repostedByManyMobile: `${params?.name}, others reposted`,
      repostedByYouOnly: 'You reposted this',
      repostedByYouAndOne: `You and ${params?.name} reposted this`,
      repostedByYouAndMany: `You and ${params?.count} others reposted this`,
      repostedByYouMobile: 'You, others reposted',
      reposters: 'Reposters',
    };
    return translations[key] || key;
  },
}));

vi.mock('@/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core')>();
  return {
    ...actual,
    useAuthStore: vi.fn((selector: (state: { currentUserPubky: string | null }) => unknown) =>
      selector({ currentUserPubky: mockCurrentUserPubky }),
    ),
  };
});

vi.mock('@/atoms', () => ({
  Container: ({
    children,
    className,
    'data-testid': dataTestId,
    onClick,
    role,
    ...rest
  }: {
    children?: React.ReactNode;
    className?: string;
    'data-testid'?: string;
    onClick?: (e: React.MouseEvent) => void;
    role?: string;
    [key: string]: unknown;
  }) => (
    <div data-testid={dataTestId} className={className} onClick={onClick} role={role} {...rest}>
      {children}
    </div>
  ),
  Typography: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
}));

const mockUsers = [
  { id: 'user1', name: 'Alice', avatarUrl: '' },
  { id: 'user2', name: 'Bob', avatarUrl: '' },
  { id: 'user3', name: 'Charlie', avatarUrl: '' },
];
let mockIsMobile = false;

vi.mock('@/hooks', () => ({
  useIsMobile: vi.fn(() => mockIsMobile),
  useRelativeTime: vi.fn(() => ({
    formatRelativeTime: () => '2h',
  })),
  useUserDetailsFromIds: vi.fn(() => ({
    users: mockUsers,
    isLoading: false,
  })),
}));

vi.mock('@/molecules', () => ({
  AvatarGroup: ({ totalCount }: { totalCount: number }) => (
    <div data-testid="avatar-group" data-total={totalCount}>
      Avatars
    </div>
  ),
  PostHeaderTimestamp: ({ timeAgo }: { timeAgo: string }) => <span data-testid="timestamp">{timeAgo}</span>,
}));

vi.mock('./RepostersOverlay/RepostersOverlay', () => ({
  RepostersOverlay: ({ open }: { open: boolean }) => (open ? <div data-testid="reposters-overlay">Overlay</div> : null),
}));

describe('GroupedRepostHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMobile = false;
    mockCurrentUserPubky = null;
  });

  it('renders repeat icon and text for single reposter', () => {
    render(<GroupedRepostHeader reposterPubkys={['user1']} earliestTimestamp={Date.now() - 7200000} />);

    const header = screen.getByTestId('grouped-repost-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Alice reposted this');
  });

  it('renders "and N others" text for multiple reposters on desktop', () => {
    render(
      <GroupedRepostHeader reposterPubkys={['user1', 'user2', 'user3']} earliestTimestamp={Date.now() - 7200000} />,
    );

    const header = screen.getByTestId('grouped-repost-header');
    expect(header).toHaveTextContent('Alice and 2 others reposted this');
  });

  it('renders "name1 and name2" text when exactly 2 reposters', () => {
    render(<GroupedRepostHeader reposterPubkys={['user1', 'user2']} earliestTimestamp={Date.now() - 7200000} />);

    const header = screen.getByTestId('grouped-repost-header');
    expect(header).toHaveTextContent('Alice and Bob reposted this');
  });

  it('renders mobile text on mobile', () => {
    mockIsMobile = true;
    render(
      <GroupedRepostHeader reposterPubkys={['user1', 'user2', 'user3']} earliestTimestamp={Date.now() - 7200000} />,
    );

    const header = screen.getByTestId('grouped-repost-header');
    expect(header).toHaveTextContent('Alice, others reposted');
  });

  it('shows AvatarGroup on desktop for multiple reposters', () => {
    render(
      <GroupedRepostHeader reposterPubkys={['user1', 'user2', 'user3']} earliestTimestamp={Date.now() - 7200000} />,
    );

    expect(screen.getByTestId('avatar-group')).toBeInTheDocument();
  });

  it('hides AvatarGroup on mobile', () => {
    mockIsMobile = true;
    render(
      <GroupedRepostHeader reposterPubkys={['user1', 'user2', 'user3']} earliestTimestamp={Date.now() - 7200000} />,
    );

    expect(screen.queryByTestId('avatar-group')).not.toBeInTheDocument();
  });

  it('renders timestamp', () => {
    render(<GroupedRepostHeader reposterPubkys={['user1']} earliestTimestamp={Date.now() - 7200000} />);

    expect(screen.getByTestId('timestamp')).toHaveTextContent('2h');
  });

  it('does not render overlay for single reposter', () => {
    render(<GroupedRepostHeader reposterPubkys={['user1']} earliestTimestamp={Date.now()} />);

    expect(screen.queryByTestId('reposters-overlay')).not.toBeInTheDocument();
  });

  it('has role="button" only for multi-reposter', () => {
    const { rerender } = render(<GroupedRepostHeader reposterPubkys={['user1']} earliestTimestamp={Date.now()} />);

    expect(screen.getByTestId('grouped-repost-header')).not.toHaveAttribute('role');

    rerender(<GroupedRepostHeader reposterPubkys={['user1', 'user2']} earliestTimestamp={Date.now()} />);

    expect(screen.getByTestId('grouped-repost-header')).toHaveAttribute('role', 'button');
  });

  it('opens overlay when clicked with multiple reposters', () => {
    render(<GroupedRepostHeader reposterPubkys={['user1', 'user2']} earliestTimestamp={Date.now()} />);

    expect(screen.queryByTestId('reposters-overlay')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('grouped-repost-header'));

    expect(screen.getByTestId('reposters-overlay')).toBeInTheDocument();
  });

  it('does not open overlay when clicked with single reposter', () => {
    render(<GroupedRepostHeader reposterPubkys={['user1']} earliestTimestamp={Date.now()} />);

    fireEvent.click(screen.getByTestId('grouped-repost-header'));

    expect(screen.queryByTestId('reposters-overlay')).not.toBeInTheDocument();
  });

  describe('current user is a reposter', () => {
    beforeEach(() => {
      mockCurrentUserPubky = 'user1';
    });

    it('shows "You reposted this" when current user is the only reposter', () => {
      render(<GroupedRepostHeader reposterPubkys={['user1']} earliestTimestamp={Date.now()} />);
      expect(screen.getByTestId('grouped-repost-header')).toHaveTextContent('You reposted this');
    });

    it('shows "You and {name}" when current user and one other', () => {
      render(<GroupedRepostHeader reposterPubkys={['user1', 'user2']} earliestTimestamp={Date.now()} />);
      expect(screen.getByTestId('grouped-repost-header')).toHaveTextContent('You and Bob reposted this');
    });

    it('shows "You and N others" when current user and multiple others', () => {
      render(<GroupedRepostHeader reposterPubkys={['user1', 'user2', 'user3']} earliestTimestamp={Date.now()} />);
      expect(screen.getByTestId('grouped-repost-header')).toHaveTextContent('You and 2 others reposted this');
    });

    it('shows "You, others reposted" on mobile', () => {
      mockIsMobile = true;
      render(<GroupedRepostHeader reposterPubkys={['user1', 'user2', 'user3']} earliestTimestamp={Date.now()} />);
      expect(screen.getByTestId('grouped-repost-header')).toHaveTextContent('You, others reposted');
    });
  });
});

describe('GroupedRepostHeader - Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMobile = false;
    mockCurrentUserPubky = null;
  });

  it('matches snapshot for single reposter', () => {
    const { container } = render(<GroupedRepostHeader reposterPubkys={['user1']} earliestTimestamp={1707000200} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for two reposters', () => {
    const { container } = render(
      <GroupedRepostHeader reposterPubkys={['user1', 'user2']} earliestTimestamp={1707000200} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for many reposters', () => {
    const { container } = render(
      <GroupedRepostHeader reposterPubkys={['user1', 'user2', 'user3']} earliestTimestamp={1707000200} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot on mobile', () => {
    mockIsMobile = true;
    const { container } = render(
      <GroupedRepostHeader reposterPubkys={['user1', 'user2', 'user3']} earliestTimestamp={1707000200} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
