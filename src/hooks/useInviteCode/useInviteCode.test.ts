import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInviteCode } from './useInviteCode';

const { mockFetchInviteCode, mockLoggerError, mockShowErrorToast } = vi.hoisted(() => ({
  mockFetchInviteCode: vi.fn(),
  mockLoggerError: vi.fn(),
  mockShowErrorToast: vi.fn(),
}));

vi.mock('@/core', () => ({
  HomegateController: { fetchInviteCode: mockFetchInviteCode },
}));

vi.mock('@/config', () => ({
  INVITE_BASE_URL: 'https://test.pubky.app/invite',
}));

vi.mock('@/libs', () => ({
  Logger: { error: mockLoggerError },
}));

vi.mock('@/molecules', () => ({
  showErrorToast: mockShowErrorToast,
}));

describe('useInviteCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const { result } = renderHook(() => useInviteCode());

    expect(result.current.inviteUrl).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('sets inviteCode and derives inviteUrl on successful fetch', async () => {
    mockFetchInviteCode.mockResolvedValue({ signupCode: 'ABC-123' });

    const { result } = renderHook(() => useInviteCode());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.fetchInviteCode();
    });

    expect(success).toBe(true);
    expect(result.current.inviteUrl).toBe('https://test.pubky.app/invite/ABC-123');
    expect(result.current.isLoading).toBe(false);
  });

  it('sets error message from Error instance and returns false on failure', async () => {
    mockFetchInviteCode.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useInviteCode());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.fetchInviteCode();
    });

    expect(success).toBe(false);
    expect(mockShowErrorToast).toHaveBeenCalledWith({ description: 'Network failure' });
    expect(mockLoggerError).toHaveBeenCalledWith('[useInviteCode] Failed to fetch invite code', {
      error: expect.any(Error),
    });
  });

  it('sets fallback error message for non-Error throws and returns false', async () => {
    mockFetchInviteCode.mockRejectedValue('something unexpected');

    const { result } = renderHook(() => useInviteCode());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.fetchInviteCode();
    });

    expect(success).toBe(false);
    expect(mockShowErrorToast).toHaveBeenCalledWith({ description: 'Failed to generate invite code' });
    expect(mockLoggerError).toHaveBeenCalledWith('[useInviteCode] Failed to fetch invite code', {
      error: 'something unexpected',
    });
  });

  it('recovers from error on subsequent successful fetch', async () => {
    mockFetchInviteCode.mockRejectedValueOnce(new Error('first error'));

    const { result } = renderHook(() => useInviteCode());

    await act(async () => {
      await result.current.fetchInviteCode();
    });

    expect(mockShowErrorToast).toHaveBeenCalledTimes(1);

    mockFetchInviteCode.mockResolvedValueOnce({ signupCode: 'NEW-CODE' });

    await act(async () => {
      await result.current.fetchInviteCode();
    });

    expect(result.current.inviteUrl).toBe('https://test.pubky.app/invite/NEW-CODE');
    expect(result.current.isLoading).toBe(false);
  });

  it('sets isLoading to true during fetch and false after', async () => {
    let resolvePromise: (value: { signupCode: string }) => void;
    mockFetchInviteCode.mockImplementation(
      () =>
        new Promise<{ signupCode: string }>((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const { result } = renderHook(() => useInviteCode());

    // Start fetch without awaiting
    let fetchPromise: Promise<boolean>;
    act(() => {
      fetchPromise = result.current.fetchInviteCode();
    });

    // isLoading should be true while awaiting
    expect(result.current.isLoading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise!({ signupCode: 'LOADING-TEST' });
      await fetchPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('updates invite code on multiple successful fetches', async () => {
    mockFetchInviteCode.mockResolvedValueOnce({ signupCode: 'FIRST-CODE' });

    const { result } = renderHook(() => useInviteCode());

    await act(async () => {
      await result.current.fetchInviteCode();
    });

    expect(result.current.inviteUrl).toBe('https://test.pubky.app/invite/FIRST-CODE');

    mockFetchInviteCode.mockResolvedValueOnce({ signupCode: 'SECOND-CODE' });

    await act(async () => {
      await result.current.fetchInviteCode();
    });

    expect(result.current.inviteUrl).toBe('https://test.pubky.app/invite/SECOND-CODE');

    mockFetchInviteCode.mockResolvedValueOnce({ signupCode: 'THIRD-CODE' });

    await act(async () => {
      await result.current.fetchInviteCode();
    });

    expect(result.current.inviteUrl).toBe('https://test.pubky.app/invite/THIRD-CODE');
    expect(mockFetchInviteCode).toHaveBeenCalledTimes(3);
  });
});
