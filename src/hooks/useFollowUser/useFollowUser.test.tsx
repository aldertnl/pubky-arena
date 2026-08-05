import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod } from '@/libs/http/http.types';
import { useFollowUser } from './useFollowUser';

const { mockUseAuthStore, mockCommitFollow, mockGetDetails, mockGetModerationId, mockLogger, mockToast } = vi.hoisted(
  () => ({
    mockUseAuthStore: vi.fn(),
    mockCommitFollow: vi.fn(),
    mockGetDetails: vi.fn(),
    mockGetModerationId: vi.fn(),
    mockLogger: {
      debug: vi.fn(),
      error: vi.fn(),
    },
    mockToast: vi.fn(),
  }),
);

vi.mock('@/config/moderation', () => ({
  getModerationId: () => mockGetModerationId(),
}));

vi.mock('@/stores/auth/auth.store', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

vi.mock('@/controllers/user/user', () => ({
  UserController: {
    commitFollow: (...args: unknown[]) => mockCommitFollow(...args),
    getDetails: (...args: unknown[]) => mockGetDetails(...args),
  },
}));

vi.mock('@/libs/logger/logger', () => ({
  Logger: mockLogger,
}));

vi.mock('@/molecules/Toaster/use-toast', () => ({
  toast: (props: unknown) => mockToast(props),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { username?: string }) => {
    if (key === 'followed') return `Following ${values?.username ?? ''}`;
    if (key === 'unfollowed') return `Unfollowed ${values?.username ?? ''}`;
    if (key === 'followFailed') return `Failed to follow ${values?.username ?? ''}`;
    if (key === 'unfollowFailed') return `Failed to unfollow ${values?.username ?? ''}`;
    if (key === 'moderationUnfollowedDescription') {
      return 'Posts labeled by this moderation account may no longer be blurred.';
    }
    if (key === 'undo') return 'Undo';
    return key;
  },
}));

describe('useFollowUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ currentUserPubky: 'current-user' });
    mockCommitFollow.mockResolvedValue(undefined);
    mockGetDetails.mockResolvedValue(null);
    mockGetModerationId.mockReturnValue('moderation-user');
    mockToast.mockReturnValue({ dismiss: vi.fn() });
  });

  it('sets error when user not authenticated', async () => {
    mockUseAuthStore.mockReturnValue({ currentUserPubky: null });

    const { result } = renderHook(() => useFollowUser());

    await act(async () => {
      await result.current.toggleFollow('user-1', false);
    });

    expect(result.current.error).toBe('User not authenticated');
    expect(mockCommitFollow).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('sets error when following self', async () => {
    const { result } = renderHook(() => useFollowUser());

    await act(async () => {
      await result.current.toggleFollow('current-user', false);
    });

    expect(result.current.error).toBe('Cannot follow yourself');
    expect(mockCommitFollow).not.toHaveBeenCalled();
  });

  it('shows success toast with provided display name on follow', async () => {
    const { result } = renderHook(() => useFollowUser());

    await act(async () => {
      await result.current.toggleFollow('user-1', false, 'Alice');
    });

    expect(mockCommitFollow).toHaveBeenCalledWith(HttpMethod.PUT, {
      follower: 'current-user',
      followee: 'user-1',
    });
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Following Alice',
    });
    expect(mockGetDetails).not.toHaveBeenCalled();
  });

  it('shows success toast with provided display name on unfollow', async () => {
    const { result } = renderHook(() => useFollowUser());

    await act(async () => {
      await result.current.toggleFollow('user-1', true, 'Alice');
    });

    expect(mockCommitFollow).toHaveBeenCalledWith(HttpMethod.DELETE, {
      follower: 'current-user',
      followee: 'user-1',
    });
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Unfollowed Alice',
    });
  });

  it('warns when the runtime-configured moderation account is unfollowed and allows undo', async () => {
    const { result } = renderHook(() => useFollowUser());

    await act(async () => {
      await result.current.toggleFollow('moderation-user', true, 'Moderator');
    });

    expect(mockCommitFollow).toHaveBeenCalledWith(HttpMethod.DELETE, {
      follower: 'current-user',
      followee: 'moderation-user',
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'warning',
        title: 'Unfollowed Moderator',
        description: 'Posts labeled by this moderation account may no longer be blurred.',
        action: expect.anything(),
      }),
    );

    const warningToast = mockToast.mock.calls[0]?.[0] as {
      action: { props: { altText: string; children: string; onClick: () => Promise<void> } };
    };
    expect(warningToast.action.props.altText).toBe('Undo');
    expect(warningToast.action.props.children).toBe('Undo');

    await act(async () => {
      await warningToast.action.props.onClick();
    });

    expect(mockCommitFollow).toHaveBeenNthCalledWith(2, HttpMethod.PUT, {
      follower: 'current-user',
      followee: 'moderation-user',
    });
    expect(mockToast).toHaveBeenLastCalledWith({ title: 'Following Moderator' });
  });

  it('shows an error toast when undoing the moderation-account unfollow fails', async () => {
    mockCommitFollow.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Undo failed'));
    const { result } = renderHook(() => useFollowUser());

    await act(async () => {
      await result.current.toggleFollow('moderation-user', true, 'Moderator');
    });

    const warningToast = mockToast.mock.calls[0]?.[0] as {
      action: { props: { onClick: () => Promise<void> } };
    };
    await act(async () => {
      await warningToast.action.props.onClick();
    });

    expect(mockToast).toHaveBeenLastCalledWith({
      variant: 'error',
      description: 'Failed to follow Moderator',
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      '[useFollowUser] Failed to undo moderation account unfollow:',
      expect.any(Error),
    );
  });

  it('resolves display name from profile when not provided', async () => {
    mockGetDetails.mockResolvedValue({ name: 'Bob' });

    const { result } = renderHook(() => useFollowUser());

    await act(async () => {
      await result.current.toggleFollow('user-1', false);
    });

    expect(mockGetDetails).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Following Bob',
    });
  });

  it('shows a friendly named error toast and resolves false when following fails', async () => {
    // A raw transport error must never reach the user.
    const error = new Error('Request failed: HTTP transport error: error sending request');
    mockCommitFollow.mockRejectedValue(error);

    const { result } = renderHook(() => useFollowUser());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.toggleFollow('user-1', false, 'Alice');
    });

    expect(returned).toBe(false);
    await waitFor(() => {
      expect(result.current.error).toBe('Failed to follow Alice');
    });
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Failed to follow Alice',
    });
    expect(mockLogger.error).toHaveBeenCalledWith('[useFollowUser] Failed to toggle follow:', error);
  });

  it('shows the unfollow-specific friendly error when unfollowing fails', async () => {
    mockCommitFollow.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useFollowUser());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.toggleFollow('user-1', true, 'Alice');
    });

    expect(returned).toBe(false);
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Failed to unfollow Alice',
    });
  });
});
