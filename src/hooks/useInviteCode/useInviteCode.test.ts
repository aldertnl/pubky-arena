import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInviteCode } from './useInviteCode';

const { mockFetchInviteCode, mockLoggerError } = vi.hoisted(() => ({
  mockFetchInviteCode: vi.fn(),
  mockLoggerError: vi.fn(),
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

describe('useInviteCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const { result } = renderHook(() => useInviteCode());

    expect(result.current.inviteCode).toBeNull();
    expect(result.current.inviteUrl).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets inviteCode and derives inviteUrl on successful fetch', async () => {
    mockFetchInviteCode.mockResolvedValue({ signupCode: 'ABC-123' });

    const { result } = renderHook(() => useInviteCode());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.fetchInviteCode();
    });

    expect(success).toBe(true);
    expect(result.current.inviteCode).toBe('ABC-123');
    expect(result.current.inviteUrl).toBe('https://test.pubky.app/invite/ABC-123');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error message from Error instance and returns false on failure', async () => {
    mockFetchInviteCode.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useInviteCode());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.fetchInviteCode();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Network failure');
    expect(result.current.inviteCode).toBeNull();
    expect(result.current.inviteUrl).toBeNull();
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
    expect(result.current.error).toBe('Failed to generate invite code');
    expect(mockLoggerError).toHaveBeenCalledWith('[useInviteCode] Failed to fetch invite code', {
      error: 'something unexpected',
    });
  });

  it('clears previous error on a new fetch call', async () => {
    mockFetchInviteCode.mockRejectedValueOnce(new Error('first error'));

    const { result } = renderHook(() => useInviteCode());

    await act(async () => {
      await result.current.fetchInviteCode();
    });

    expect(result.current.error).toBe('first error');

    mockFetchInviteCode.mockResolvedValueOnce({ signupCode: 'NEW-CODE' });

    await act(async () => {
      await result.current.fetchInviteCode();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.inviteCode).toBe('NEW-CODE');
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

    expect(result.current.inviteCode).toBe('FIRST-CODE');
    expect(result.current.inviteUrl).toBe('https://test.pubky.app/invite/FIRST-CODE');

    mockFetchInviteCode.mockResolvedValueOnce({ signupCode: 'SECOND-CODE' });

    await act(async () => {
      await result.current.fetchInviteCode();
    });

    expect(result.current.inviteCode).toBe('SECOND-CODE');
    expect(result.current.inviteUrl).toBe('https://test.pubky.app/invite/SECOND-CODE');

    mockFetchInviteCode.mockResolvedValueOnce({ signupCode: 'THIRD-CODE' });

    await act(async () => {
      await result.current.fetchInviteCode();
    });

    expect(result.current.inviteCode).toBe('THIRD-CODE');
    expect(result.current.inviteUrl).toBe('https://test.pubky.app/invite/THIRD-CODE');
    expect(mockFetchInviteCode).toHaveBeenCalledTimes(3);
  });
});
