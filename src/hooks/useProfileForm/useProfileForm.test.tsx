import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getModerationId } from '@/config/moderation';
import { AuthController } from '@/controllers/auth/auth';
import { ProfileController } from '@/controllers/profile/profile';
import { UserController } from '@/controllers/user/user';
import { HttpMethod } from '@/libs/http/http.types';
import type { NexusUserDetails } from '@/services/nexus/nexus.types';
import { useProfileForm } from './useProfileForm';

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routerBack: vi.fn(),
  toast: vi.fn(),
  getModerationId: vi.fn(),
  commitFollow: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.routerPush, back: mocks.routerBack }),
}));

vi.mock('@/controllers/auth/auth', () => ({
  AuthController: { bootstrapWithDelay: vi.fn() },
}));

vi.mock('@/config/moderation', () => ({
  getModerationId: mocks.getModerationId,
}));

vi.mock('@/controllers/file/file', () => ({
  FileController: { commitCreate: vi.fn(), getAvatarUrl: vi.fn() },
}));

vi.mock('@/controllers/profile/profile', () => ({
  ProfileController: { commitCreate: vi.fn(), commitUpdate: vi.fn() },
}));

vi.mock('@/controllers/user/user', () => ({
  UserController: { commitFollow: mocks.commitFollow },
}));

vi.mock('@/molecules/Toaster/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/stores/localFiles/localFiles.store', () => ({
  useLocalFilesStore: { getState: () => ({ setProfile: vi.fn() }) },
}));

const pubky = 'test-pubky';
const configuredModerationId = '68rkfi1d78baobycj6w4b7dga43o8qtnuhubban5at6qywrieb5y';
const unsafeLink = { label: 'Website', url: 'javascript:alert(1)' };

const userDetails: NexusUserDetails = {
  id: pubky,
  name: 'Valid User',
  bio: '',
  links: [],
  status: null,
  image: null,
  indexed_at: 1,
};

describe('useProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getModerationId.mockReturnValue(configuredModerationId);
    mocks.commitFollow.mockResolvedValue(undefined);
  });

  it('blocks an unsafe link from the create-profile submission path', async () => {
    const { result } = renderHook(() => useProfileForm({ mode: 'create', pubky, setShowWelcomeDialog: vi.fn() }));

    act(() => {
      result.current.handlers.setName('Valid User');
      result.current.handlers.setLinks([unsafeLink]);
      result.current.handlers.validateLinkUrl(unsafeLink.url, 0);
    });

    expect(result.current.errors.linkUrlErrors[0]).toBe('Invalid URL');

    await act(async () => {
      await result.current.handlers.handleSubmit();
    });

    expect(ProfileController.commitCreate).not.toHaveBeenCalled();
  });

  it('blocks an unsafe legacy link from the edit-profile submission path', async () => {
    const unsafeUserDetails: NexusUserDetails = {
      id: pubky,
      name: 'Valid User',
      bio: '',
      links: [{ title: unsafeLink.label, url: unsafeLink.url }],
      status: null,
      image: null,
      indexed_at: 1,
    };
    const { result } = renderHook(() => useProfileForm({ mode: 'edit', pubky, userDetails: unsafeUserDetails }));

    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    act(() => {
      result.current.handlers.validateLinkUrl(unsafeLink.url, 0);
    });

    expect(result.current.errors.linkUrlErrors[0]).toBe('Invalid URL');

    await act(async () => {
      await result.current.handlers.handleSubmit();
    });

    expect(ProfileController.commitUpdate).not.toHaveBeenCalled();
  });

  it('follows the runtime-configured moderation account on profile creation', async () => {
    const { result } = renderHook(() => useProfileForm({ mode: 'create', pubky, setShowWelcomeDialog: vi.fn() }));

    act(() => {
      result.current.handlers.setName('Valid User');
    });

    await act(async () => {
      await result.current.handlers.handleSubmit();
    });

    expect(getModerationId).toHaveBeenCalledOnce();
    expect(UserController.commitFollow).toHaveBeenCalledOnce();
    expect(UserController.commitFollow).toHaveBeenCalledWith(HttpMethod.PUT, {
      follower: pubky,
      followee: configuredModerationId,
    });
  });

  it('completes the follow before creating and bootstrapping the profile', async () => {
    let resolveFollow: (() => void) | undefined;
    mocks.commitFollow.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFollow = resolve;
        }),
    );
    const setShowWelcomeDialog = vi.fn();
    const { result } = renderHook(() => useProfileForm({ mode: 'create', pubky, setShowWelcomeDialog }));

    act(() => {
      result.current.handlers.setName('Valid User');
    });

    let submitPromise: Promise<void> | undefined;
    act(() => {
      submitPromise = result.current.handlers.handleSubmit();
    });

    await waitFor(() => expect(UserController.commitFollow).toHaveBeenCalledOnce());
    expect(ProfileController.commitCreate).not.toHaveBeenCalled();

    resolveFollow?.();
    await act(async () => {
      await submitPromise;
    });

    const followOrder = vi.mocked(UserController.commitFollow).mock.invocationCallOrder[0];
    const profileOrder = vi.mocked(ProfileController.commitCreate).mock.invocationCallOrder[0];
    const bootstrapOrder = vi.mocked(AuthController.bootstrapWithDelay).mock.invocationCallOrder[0];
    const welcomeOrder = setShowWelcomeDialog.mock.invocationCallOrder[0];
    const navigationOrder = mocks.routerPush.mock.invocationCallOrder[0];

    expect(followOrder).toBeLessThan(profileOrder);
    expect(profileOrder).toBeLessThan(bootstrapOrder);
    expect(bootstrapOrder).toBeLessThan(welcomeOrder);
    expect(welcomeOrder).toBeLessThan(navigationOrder);
  });

  it('blocks profile creation when the follow fails and succeeds on retry', async () => {
    mocks.commitFollow.mockRejectedValueOnce(new Error('Follow failed'));
    const setShowWelcomeDialog = vi.fn();
    const { result } = renderHook(() => useProfileForm({ mode: 'create', pubky, setShowWelcomeDialog }));

    act(() => {
      result.current.handlers.setName('Valid User');
    });

    await act(async () => {
      await result.current.handlers.handleSubmit();
    });

    expect(ProfileController.commitCreate).not.toHaveBeenCalled();
    expect(AuthController.bootstrapWithDelay).not.toHaveBeenCalled();
    expect(setShowWelcomeDialog).not.toHaveBeenCalled();
    expect(mocks.routerPush).not.toHaveBeenCalled();

    mocks.commitFollow.mockResolvedValueOnce(undefined);
    await act(async () => {
      await result.current.handlers.handleSubmit();
    });

    expect(UserController.commitFollow).toHaveBeenCalledTimes(2);
    expect(ProfileController.commitCreate).toHaveBeenCalledOnce();
    expect(AuthController.bootstrapWithDelay).toHaveBeenCalledOnce();
    expect(setShowWelcomeDialog).toHaveBeenCalledWith(true);
    expect(mocks.routerPush).toHaveBeenCalledOnce();
  });

  it('updates an existing profile without reading configuration or following', async () => {
    const { result } = renderHook(() => useProfileForm({ mode: 'edit', pubky, userDetails }));

    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    await act(async () => {
      await result.current.handlers.handleSubmit();
    });

    expect(ProfileController.commitUpdate).toHaveBeenCalledOnce();
    expect(getModerationId).not.toHaveBeenCalled();
    expect(UserController.commitFollow).not.toHaveBeenCalled();
  });
});
