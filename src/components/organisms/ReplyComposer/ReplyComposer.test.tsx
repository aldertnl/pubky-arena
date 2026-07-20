import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { POST_INPUT_VARIANT } from '@/organisms/PostInput/PostInput.constants';
import { PostInput } from '../PostInput/PostInput';
import { ReplyComposer } from './ReplyComposer';

vi.mock('@/molecules/PostPreviewCard/PostPreviewCard', () => ({
  PostPreviewCard: ({
    postId,
    interactiveActions,
    navigable,
  }: {
    postId: string;
    interactiveActions?: boolean;
    navigable?: boolean;
  }) => (
    <div
      data-testid="post-preview"
      data-post-id={postId}
      data-interactive-actions={String(interactiveActions ?? true)}
      data-navigable={String(navigable ?? true)}
    />
  ),
}));

vi.mock('../PostInput/PostInput', () => ({
  PostInput: vi.fn(({ postId, showThreadConnector }) => (
    <div data-testid="post-input" data-post-id={postId} data-show-thread={String(showThreadConnector)} />
  )),
}));

describe('ReplyComposer', () => {
  it('keeps the existing connected preview layout in dialogs', () => {
    const onContentChange = vi.fn();
    render(
      <ReplyComposer postId="author:post" resetKey={0} onSuccess={vi.fn()} onContentChange={onContentChange} />,
    );

    expect(screen.getByTestId('post-preview')).toHaveAttribute('data-navigable', 'true');
    expect(screen.getByTestId('post-input')).toHaveAttribute('data-show-thread', 'true');
    expect(PostInput).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: POST_INPUT_VARIANT.REPLY,
        postId: 'author:post',
        expanded: true,
        autoFocusTextarea: true,
        onContentChange,
      }),
      undefined,
    );
  });

  it('bounds and disables the parent preview in page presentation', () => {
    render(
      <ReplyComposer
        postId="author:post"
        resetKey={0}
        onSuccess={vi.fn()}
        onContentChange={vi.fn()}
        presentation="page"
      />,
    );

    expect(screen.getByTestId('post-preview')).toHaveAttribute('data-interactive-actions', 'false');
    expect(screen.getByTestId('post-preview')).toHaveAttribute('data-navigable', 'false');
    expect(screen.getByTestId('post-preview').parentElement).toHaveClass('max-h-40', 'overflow-hidden');
    expect(screen.getByTestId('post-input')).toHaveAttribute('data-show-thread', 'false');
  });
});

describe('ReplyComposer - Snapshots', () => {
  it('matches snapshot for the routed page presentation', () => {
    const { container } = render(
      <ReplyComposer
        postId="author:snapshot-post"
        resetKey={0}
        onSuccess={vi.fn()}
        onContentChange={vi.fn()}
        presentation="page"
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
