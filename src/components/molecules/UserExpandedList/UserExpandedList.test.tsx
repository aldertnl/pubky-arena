import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserExpandedList } from './UserExpandedList';
import type { TaggerWithAvatar } from '@/molecules/TaggedItem/TaggedItem.types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockToggleFollow = vi.fn();
const mockIsUserLoading = vi.fn().mockReturnValue(false);
vi.mock('@/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks')>();
  return {
    ...actual,
    useFollowUser: vi.fn(() => ({
      toggleFollow: mockToggleFollow,
      isUserLoading: mockIsUserLoading,
    })),
    useRequireAuth: vi.fn(() => ({
      isAuthenticated: true,
      requireAuth: vi.fn((action: () => void) => action()),
    })),
    useBulkUserAvatars: vi.fn((ids: string[]) => ({
      getUsersWithAvatars: () => ids.map((id) => ({ id, name: id, avatarUrl: '' })),
      isLoading: false,
    })),
  };
});

vi.mock('@/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core')>();
  return {
    ...actual,
    useAuthStore: vi.fn(() => ({
      currentUserPubky: 'current-user-pubky',
    })),
  };
});

vi.mock('@/molecules', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/molecules')>();
  return {
    ...actual,
    TaggerUserRow: ({
      tagger,
      onUserClick,
      onFollowClick,
      isLoading,
      isCurrentUser,
    }: {
      tagger: { id: string; name?: string };
      onUserClick?: (id: string) => void;
      onFollowClick?: (id: string, isFollowing: boolean) => void;
      isLoading?: boolean;
      isCurrentUser?: boolean;
    }) => (
      <div data-testid={`user-list-item-${tagger.id}`} data-loading={isLoading} data-current-user={isCurrentUser}>
        <span>{tagger.name || tagger.id}</span>
        <button data-testid={`user-click-${tagger.id}`} onClick={() => onUserClick?.(tagger.id)}>
          View Profile
        </button>
        <button data-testid={`follow-click-${tagger.id}`} onClick={() => onFollowClick?.(tagger.id, false)}>
          Follow
        </button>
      </div>
    ),
  };
});

const mockUsers: TaggerWithAvatar[] = [
  { id: 'user1', avatarUrl: 'https://cdn.example.com/avatar/user1', name: 'Alice' },
  { id: 'user2', avatarUrl: 'https://cdn.example.com/avatar/user2', name: 'Bob' },
  { id: 'user3', avatarUrl: 'https://cdn.example.com/avatar/user3' },
];
const mockUserIds = mockUsers.map((user) => user.id);

describe('UserExpandedList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it('renders with default props', () => {
    render(<UserExpandedList userIds={mockUserIds} />);
    expect(screen.getByTestId('user-expanded-list')).toBeInTheDocument();
  });

  it('renders all users as list items', () => {
    render(<UserExpandedList userIds={mockUserIds} />);
    expect(screen.getByTestId('user-list-item-user1')).toBeInTheDocument();
    expect(screen.getByTestId('user-list-item-user2')).toBeInTheDocument();
    expect(screen.getByTestId('user-list-item-user3')).toBeInTheDocument();
  });

  it('returns null when userIds array is empty', () => {
    const { container } = render(<UserExpandedList userIds={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders skeleton when isLoading is true', () => {
    render(<UserExpandedList userIds={mockUserIds} isLoading />);
    expect(screen.getByTestId('user-expanded-list-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('user-expanded-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-list-item-user1')).not.toBeInTheDocument();
  });

  it('navigates to user profile when user is clicked', () => {
    render(<UserExpandedList userIds={mockUserIds} />);
    fireEvent.click(screen.getByTestId('user-click-user1'));
    expect(mockPush).toHaveBeenCalledWith('/profile/user1');
  });

  it('calls toggleFollow when follow button is clicked', () => {
    render(<UserExpandedList userIds={mockUserIds} />);
    fireEvent.click(screen.getByTestId('follow-click-user1'));
    expect(mockToggleFollow).toHaveBeenCalledWith('user1', false);
  });

  it('applies custom data-testid', () => {
    render(<UserExpandedList userIds={mockUserIds} data-testid="custom-test-id" />);
    expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
  });
});

describe('UserExpandedList - Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('matches snapshot with single user', () => {
    const { container } = render(<UserExpandedList userIds={['user1']} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with multiple users', () => {
    const { container } = render(<UserExpandedList userIds={mockUserIds} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with empty users', () => {
    const { container } = render(<UserExpandedList userIds={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
