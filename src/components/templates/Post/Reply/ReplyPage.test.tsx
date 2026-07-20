import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConfirmableDialog } from '@/hooks/useConfirmableDialog/useConfirmableDialog';
import { ReplyPage } from './ReplyPage';

const mockRouterBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockRouterBack }),
}));

vi.mock('@/hooks/useConfirmableDialog/useConfirmableDialog', () => ({
  useConfirmableDialog: vi.fn(),
}));

vi.mock('@/organisms/ReplyComposer/ReplyComposer', () => ({
  ReplyComposer: ({ postId, onSuccess, presentation }: { postId: string; onSuccess: () => void; presentation: string }) => (
    <div data-testid="reply-composer" data-post-id={postId} data-presentation={presentation}>
      <button type="button" onClick={onSuccess}>
        Complete reply
      </button>
    </div>
  ),
}));

vi.mock('@/molecules/DialogConfirmDiscard/DialogConfirmDiscard', () => ({
  DialogConfirmDiscard: ({ open, onConfirm }: { open: boolean; onConfirm: () => void }) => (
    <div data-testid="discard-dialog" data-open={String(open)}>
      <button type="button" onClick={onConfirm}>
        Confirm discard
      </button>
    </div>
  ),
}));

describe('ReplyPage', () => {
  const handleOpenChange = vi.fn();
  const handleDiscard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConfirmableDialog).mockReturnValue({
      showConfirmDialog: false,
      setShowConfirmDialog: vi.fn(),
      resetKey: 0,
      handleContentChange: vi.fn(),
      handleOpenChange,
      handleDiscard,
    });
  });

  it('renders a full-viewport page with the shared composer', () => {
    render(<ReplyPage postId="author:post-id" />);

    expect(screen.getByRole('main')).toHaveClass('fixed', 'inset-0', 'h-dvh', 'bg-background');
    expect(screen.getByTestId('reply-composer')).toHaveAttribute('data-post-id', 'author:post-id');
    expect(screen.getByTestId('reply-composer')).toHaveAttribute('data-presentation', 'page');
  });

  it('checks for a draft before navigating back', () => {
    render(<ReplyPage postId="author:post-id" />);

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('returns through browser history after a successful reply', () => {
    render(<ReplyPage postId="author:post-id" />);

    fireEvent.click(screen.getByRole('button', { name: 'Complete reply' }));

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });
});

describe('ReplyPage - Snapshots', () => {
  beforeEach(() => {
    vi.mocked(useConfirmableDialog).mockReturnValue({
      showConfirmDialog: false,
      setShowConfirmDialog: vi.fn(),
      resetKey: 0,
      handleContentChange: vi.fn(),
      handleOpenChange: vi.fn(),
      handleDiscard: vi.fn(),
    });
  });

  it('matches snapshot for the reply page', () => {
    const { container } = render(<ReplyPage postId="author:snapshot-post" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
