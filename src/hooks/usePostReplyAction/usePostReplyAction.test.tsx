import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from '@/hooks/useIsMobile/useIsMobile';
import { usePostReplyAction } from './usePostReplyAction';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/hooks/useIsMobile/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

describe('usePostReplyAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsMobile).mockReturnValue(false);
  });

  it('keeps the existing dialog action on desktop', () => {
    const onDesktopReply = vi.fn();
    const { result } = renderHook(() => usePostReplyAction('author:post-id', { onDesktopReply }));

    act(() => result.current.openReply());

    expect(onDesktopReply).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('opens the full-screen composer directly on mobile', () => {
    vi.mocked(useIsMobile).mockReturnValue(true);
    const { result } = renderHook(() => usePostReplyAction('author:post-id'));

    act(() => result.current.openReply());

    expect(mockPush).toHaveBeenCalledWith('/post/author/post-id/reply');
  });

  it('opens the composer for an explicitly targeted post', () => {
    vi.mocked(useIsMobile).mockReturnValue(true);
    const { result } = renderHook(() => usePostReplyAction('author:post-id'));

    act(() => result.current.openReply('original-author:original-post'));

    expect(mockPush).toHaveBeenCalledWith('/post/original-author/original-post/reply');
  });
});
