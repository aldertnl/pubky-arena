import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth/auth.store';
import { useSignOut } from './useSignOut';

const mockPush = vi.fn();
const mockLogout = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/controllers/auth/auth', () => ({
  AuthController: {
    logout: () => mockLogout(),
  },
}));

vi.mock('@/app/routes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/routes')>();
  return {
    ...actual,
    AUTH_ROUTES: { LOGOUT: '/logout' },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ isLoggingOut: false });
});

describe('useSignOut', () => {
  it('returns handleSignOut and isLoading', () => {
    const { result } = renderHook(() => useSignOut());

    expect(result.current.handleSignOut).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('navigates to the logout route without waiting for session cleanup', () => {
    const { result } = renderHook(() => useSignOut());

    act(() => {
      result.current.handleSignOut();
    });

    expect(mockPush).toHaveBeenCalledWith('/logout');
    expect(mockLogout).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
    // Leave authStore.isLoggingOut false so `/logout` still starts AuthController.logout().
    expect(useAuthStore.getState().isLoggingOut).toBe(false);
  });
});
