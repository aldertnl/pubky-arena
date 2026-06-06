import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPostHomeserverVerificationCoordinator } from './postHomeserverVerificationCoordinator';
import { usePostHomeserverVerification } from './usePostHomeserverVerification';

const mockFetchHomeserverVerification = vi.fn();

vi.mock('@/controllers/post/post', () => ({
  PostController: {
    fetchHomeserverVerification: (params: { compositeId: string }) => mockFetchHomeserverVerification(params),
  },
}));

describe('usePostHomeserverVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPostHomeserverVerificationCoordinator();
    mockFetchHomeserverVerification.mockResolvedValue({ verified: true });
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => usePostHomeserverVerification('author:post123'));

    expect(result.current.status).toBe('idle');
    expect(result.current.isVerified).toBe(false);
  });

  it('transitions to verified when homeserver check succeeds', async () => {
    const { result } = renderHook(() => usePostHomeserverVerification('author:post123'));

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('verified');
    });
    expect(result.current.isVerified).toBe(true);
    expect(mockFetchHomeserverVerification).toHaveBeenCalledWith({ compositeId: 'author:post123' });
  });

  it('transitions to not_found when homeserver check returns false', async () => {
    mockFetchHomeserverVerification.mockResolvedValue({ verified: false });

    const { result } = renderHook(() => usePostHomeserverVerification('author:post123'));

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('not_found');
    });
    expect(result.current.isVerified).toBe(false);
  });

  it('transitions to error when controller throws', async () => {
    mockFetchHomeserverVerification.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePostHomeserverVerification('author:post123'));

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });

  it('does not verify when compositeId is null', async () => {
    const { result } = renderHook(() => usePostHomeserverVerification(null));

    await act(async () => {
      await result.current.verify();
    });

    expect(mockFetchHomeserverVerification).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('does not re-verify when already verified', async () => {
    const { result } = renderHook(() => usePostHomeserverVerification('author:post123'));

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('verified');
    });

    await act(async () => {
      await result.current.verify();
    });

    expect(mockFetchHomeserverVerification).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent verify calls for the same post', async () => {
    let resolveVerification: (value: { verified: boolean }) => void = () => {};
    mockFetchHomeserverVerification.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveVerification = resolve;
        }),
    );

    const { result: resultA } = renderHook(() => usePostHomeserverVerification('author:post123'));
    const { result: resultB } = renderHook(() => usePostHomeserverVerification('author:post123'));

    await act(async () => {
      void resultA.current.verify();
      void resultB.current.verify();
    });

    resolveVerification({ verified: true });

    await waitFor(() => {
      expect(resultA.current.status).toBe('verified');
      expect(resultB.current.status).toBe('verified');
    });

    expect(mockFetchHomeserverVerification).toHaveBeenCalledTimes(1);
  });
});
