import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnrichedPostDetails } from '@/application/moderation/moderation.types';
import { useIsMobile } from '@/hooks/useIsMobile/useIsMobile';
import { usePostDetails } from '@/hooks/usePostDetails/usePostDetails';
import { usePostNavigation } from '@/hooks/usePostNavigation/usePostNavigation';
import { asOpaque } from '@/test-utils/type-assertions';
import { usePostReplyAction } from './usePostReplyAction';

const mockUsePathname = vi.fn(() => '/home');
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/hooks/useIsMobile/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

vi.mock('@/hooks/usePostDetails/usePostDetails', () => ({
  usePostDetails: vi.fn(),
}));

vi.mock('@/hooks/usePostNavigation/usePostNavigation', () => ({
  usePostNavigation: vi.fn(),
}));

const mockNavigateToPost = vi.fn();

describe('usePostReplyAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/home');
    vi.mocked(useIsMobile).mockReturnValue(false);
    vi.mocked(usePostDetails).mockReturnValue({ postDetails: undefined, isLoading: true });
    vi.mocked(usePostNavigation).mockReturnValue({
      getPostHref: vi.fn(),
      navigateToPost: mockNavigateToPost,
      getCollectionHref: vi.fn(),
      navigateToCollection: vi.fn(),
      handlePostClick: vi.fn(),
      handlePostAuxClick: vi.fn(),
      handlePostKeyDown: vi.fn(),
    });
  });

  it('keeps the existing dialog action on desktop', () => {
    const onDesktopReply = vi.fn();
    const { result } = renderHook(() => usePostReplyAction('author:post-id', { onDesktopReply }));

    act(() => result.current.openReply());

    expect(onDesktopReply).toHaveBeenCalledTimes(1);
    expect(mockNavigateToPost).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('opens the thread first from a mobile feed surface', () => {
    vi.mocked(useIsMobile).mockReturnValue(true);
    mockUsePathname.mockReturnValue('/home');
    const { result } = renderHook(() => usePostReplyAction('author:post-id'));

    act(() => result.current.openReply());

    expect(mockNavigateToPost).toHaveBeenCalledWith('author:post-id');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('opens the full-screen composer from a mobile post thread', () => {
    vi.mocked(useIsMobile).mockReturnValue(true);
    mockUsePathname.mockReturnValue('/post/author/post-id');
    const { result } = renderHook(() => usePostReplyAction('author:reply-id'));

    act(() => result.current.openReply());

    expect(mockPush).toHaveBeenCalledWith('/post/author/reply-id/reply');
    expect(mockNavigateToPost).not.toHaveBeenCalled();
  });

  it('opens the composer directly for a collection instead of navigating to its reply-less canonical detail', () => {
    vi.mocked(useIsMobile).mockReturnValue(true);
    vi.mocked(usePostDetails).mockReturnValue({
      postDetails: asOpaque<EnrichedPostDetails>({ kind: 'collection' }),
      isLoading: false,
    });
    const { result } = renderHook(() => usePostReplyAction('author:collection-id'));

    act(() => result.current.openReply());

    expect(usePostDetails).toHaveBeenCalledWith('author:collection-id');
    expect(mockPush).toHaveBeenCalledWith('/post/author/collection-id/reply');
    expect(mockNavigateToPost).not.toHaveBeenCalled();
  });
});
