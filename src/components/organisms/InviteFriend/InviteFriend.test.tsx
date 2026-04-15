import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InviteFriend } from './InviteFriend';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Use vi.hoisted to define mock functions before vi.mock calls
const { mockFetchInviteCode, mockUseCurrentUserProfile, mockUseInviteCode } = vi.hoisted(() => ({
  mockFetchInviteCode: vi.fn(),
  mockUseCurrentUserProfile: vi.fn(),
  mockUseInviteCode: vi.fn(),
}));

// Mock @/hooks
vi.mock('@/hooks', () => ({
  useCurrentUserProfile: mockUseCurrentUserProfile,
  useInviteCode: mockUseInviteCode,
}));

// Mock @/molecules
vi.mock('@/molecules', () => ({
  SidebarSection: ({
    children,
    title,
    className,
    ...rest
  }: {
    children: React.ReactNode;
    title: string;
    className?: string;
    'data-testid'?: string;
  }) => (
    <div data-testid={rest['data-testid']} className={className} data-title={title}>
      <span>{title}</span>
      {children}
    </div>
  ),
}));

// Mock @/organisms
vi.mock('@/organisms', () => ({
  DialogInviteFriend: ({
    open,
    inviteUrl,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inviteUrl: string;
  }) => (open ? <div data-testid="dialog-invite-friend" data-invite-url={inviteUrl} /> : null),
}));

// Mock @/atoms
vi.mock('@/atoms', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    className,
    ...rest
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    className?: string;
    'data-testid'?: string;
  }) => (
    <button
      data-testid={rest['data-testid']}
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={className}
    >
      {children}
    </button>
  ),
}));

// Mock @/libs (icon stubs)
vi.mock('@/libs', () => ({
  Loader2: ({ className }: { className?: string }) => <span data-testid="loader-icon" className={className} />,
  Gift: ({ className }: { className?: string }) => <span data-testid="gift-icon" className={className} />,
}));

describe('InviteFriend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentUserProfile.mockReturnValue({ currentUserPubky: 'test-pubky-123' });
    mockUseInviteCode.mockReturnValue({
      inviteUrl: null,
      isLoading: false,
      fetchInviteCode: mockFetchInviteCode,
    });
    mockFetchInviteCode.mockResolvedValue(false);
  });

  it('renders nothing when user is not authenticated', () => {
    mockUseCurrentUserProfile.mockReturnValue({ currentUserPubky: null });

    const { container } = render(<InviteFriend />);

    expect(container.innerHTML).toBe('');
  });

  it('renders section with button when user is authenticated', () => {
    render(<InviteFriend />);

    expect(screen.getByTestId('invite-friend')).toBeInTheDocument();
    expect(screen.getByTestId('invite-friend-button')).toBeInTheDocument();
    expect(screen.getByText('sectionTitle')).toBeInTheDocument();
    expect(screen.getByText('buttonLabel')).toBeInTheDocument();
    expect(screen.getByTestId('gift-icon')).toBeInTheDocument();
  });

  it('calls fetchInviteCode on button click', async () => {
    render(<InviteFriend />);

    fireEvent.click(screen.getByTestId('invite-friend-button'));

    expect(mockFetchInviteCode).toHaveBeenCalledTimes(1);
  });

  it('opens dialog when fetchInviteCode succeeds', async () => {
    mockFetchInviteCode.mockResolvedValue(true);
    mockUseInviteCode.mockReturnValue({
      inviteUrl: 'https://invite.example.com/code123',
      isLoading: false,
      fetchInviteCode: mockFetchInviteCode,
    });

    render(<InviteFriend />);

    // Dialog should not be visible before click
    expect(screen.queryByTestId('dialog-invite-friend')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('invite-friend-button'));

    await waitFor(() => {
      expect(screen.getByTestId('dialog-invite-friend')).toBeInTheDocument();
    });

    expect(screen.getByTestId('dialog-invite-friend')).toHaveAttribute(
      'data-invite-url',
      'https://invite.example.com/code123',
    );
  });

  it('does NOT open dialog when fetchInviteCode fails', async () => {
    mockFetchInviteCode.mockResolvedValue(false);
    mockUseInviteCode.mockReturnValue({
      inviteUrl: 'https://invite.example.com/code123',
      isLoading: false,
      fetchInviteCode: mockFetchInviteCode,
    });

    render(<InviteFriend />);

    fireEvent.click(screen.getByTestId('invite-friend-button'));

    await waitFor(() => {
      expect(mockFetchInviteCode).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByTestId('dialog-invite-friend')).not.toBeInTheDocument();
  });

  it('button is disabled while loading', () => {
    mockUseInviteCode.mockReturnValue({
      inviteUrl: null,
      isLoading: true,
      fetchInviteCode: mockFetchInviteCode,
    });

    render(<InviteFriend />);

    const button = screen.getByTestId('invite-friend-button');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('gift-icon')).not.toBeInTheDocument();
  });
});

describe('InviteFriend - Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentUserProfile.mockReturnValue({ currentUserPubky: 'test-pubky-123' });
    mockUseInviteCode.mockReturnValue({
      inviteUrl: null,
      isLoading: false,
      fetchInviteCode: mockFetchInviteCode,
    });
  });

  it('matches snapshot for authenticated user default state', () => {
    const { container } = render(<InviteFriend className="test-class" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
