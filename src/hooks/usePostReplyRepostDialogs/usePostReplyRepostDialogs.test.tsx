import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from '@/hooks/useIsMobile/useIsMobile';
import { usePostReplyRepostDialogs } from './usePostReplyRepostDialogs';

const mockRouterPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('@/hooks/useIsMobile/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

vi.mock('@/organisms/DialogReply/DialogReply', () => ({
  DialogReply: ({
    postId,
    open,
    onOpenChangeAction,
  }: {
    postId: string;
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
  }) => (
    <div data-testid="dialog-reply" data-post-id={postId} data-open={open}>
      <button data-testid="close-reply-dialog" onClick={() => onOpenChangeAction(false)}>
        Close Reply
      </button>
    </div>
  ),
}));

vi.mock('@/organisms/DialogRepost/DialogRepost', () => ({
  DialogRepost: ({
    postId,
    open,
    onOpenChangeAction,
    config,
  }: {
    postId: string;
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
    config?: { title?: string };
  }) => (
    <div data-testid="dialog-repost" data-post-id={postId} data-open={open} data-config-title={config?.title}>
      <button data-testid="close-repost-dialog" onClick={() => onOpenChangeAction(false)}>
        Close Repost
      </button>
    </div>
  ),
}));

describe('usePostReplyRepostDialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsMobile).mockReturnValue(false);
  });

  it('renders both dialogs closed initially', () => {
    const { result } = renderHook(() => usePostReplyRepostDialogs('author:post-id'));

    render(result.current.dialogs);

    expect(screen.getByTestId('dialog-reply')).toHaveAttribute('data-post-id', 'author:post-id');
    expect(screen.getByTestId('dialog-reply')).toHaveAttribute('data-open', 'false');
    expect(screen.getByTestId('dialog-repost')).toHaveAttribute('data-post-id', 'author:post-id');
    expect(screen.getByTestId('dialog-repost')).toHaveAttribute('data-open', 'false');
  });

  it('forwards the repost config to DialogRepost', () => {
    const { result } = renderHook(() =>
      usePostReplyRepostDialogs('author:post-id', { title: 'Share Collection', submitLabel: 'Share' }),
    );

    render(result.current.dialogs);

    expect(screen.getByTestId('dialog-repost')).toHaveAttribute('data-config-title', 'Share Collection');
  });

  it('opens only the reply dialog', () => {
    const { result } = renderHook(() => usePostReplyRepostDialogs('author:post-id'));
    const view = render(result.current.dialogs);

    act(() => {
      result.current.openReply();
    });
    view.rerender(result.current.dialogs);

    expect(screen.getByTestId('dialog-reply')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('dialog-repost')).toHaveAttribute('data-open', 'false');
  });

  it('navigates to the reply page instead of opening a dialog on mobile', () => {
    vi.mocked(useIsMobile).mockReturnValue(true);
    const { result } = renderHook(() => usePostReplyRepostDialogs('author:post-id'));
    const view = render(result.current.dialogs);

    act(() => {
      result.current.openReply();
    });
    view.rerender(result.current.dialogs);

    expect(mockRouterPush).toHaveBeenCalledWith('/post/author/post-id/reply');
    expect(screen.getByTestId('dialog-reply')).toHaveAttribute('data-open', 'false');
  });

  it('opens only the repost dialog', () => {
    const { result } = renderHook(() => usePostReplyRepostDialogs('author:post-id'));
    const view = render(result.current.dialogs);

    act(() => {
      result.current.openRepostDialog();
    });
    view.rerender(result.current.dialogs);

    expect(screen.getByTestId('dialog-reply')).toHaveAttribute('data-open', 'false');
    expect(screen.getByTestId('dialog-repost')).toHaveAttribute('data-open', 'true');
  });

  it('allows dialogs to close through their open-change handlers', () => {
    const { result } = renderHook(() => usePostReplyRepostDialogs('author:post-id'));
    const view = render(result.current.dialogs);

    act(() => {
      result.current.openReply();
      result.current.openRepostDialog();
    });
    view.rerender(result.current.dialogs);

    expect(screen.getByTestId('dialog-reply')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('dialog-repost')).toHaveAttribute('data-open', 'true');

    fireEvent.click(screen.getByTestId('close-reply-dialog'));
    fireEvent.click(screen.getByTestId('close-repost-dialog'));
    view.rerender(result.current.dialogs);

    expect(screen.getByTestId('dialog-reply')).toHaveAttribute('data-open', 'false');
    expect(screen.getByTestId('dialog-repost')).toHaveAttribute('data-open', 'false');
  });
});
