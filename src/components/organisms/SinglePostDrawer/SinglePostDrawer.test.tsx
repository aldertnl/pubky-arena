import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SinglePostDrawer } from './SinglePostDrawer';

vi.mock('@/atoms', () => ({
  Container: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="container" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('../SinglePostParticipants', () => ({
  SinglePostParticipants: ({ postId }: { postId: string }) => (
    <div data-testid="single-post-participants" data-post-id={postId}>
      SinglePostParticipants
    </div>
  ),
}));

describe('SinglePostDrawer', () => {
  it('renders participants', () => {
    render(<SinglePostDrawer postId="author:post-1" />);

    expect(screen.getByTestId('single-post-participants')).toBeInTheDocument();
  });

  it('passes postId to SinglePostParticipants', () => {
    render(<SinglePostDrawer postId="author:post-123" />);

    expect(screen.getByTestId('single-post-participants')).toHaveAttribute('data-post-id', 'author:post-123');
  });

  it('does not render feedback card', () => {
    render(<SinglePostDrawer postId="author:post-1" />);

    expect(screen.queryByTestId('feedback-card')).not.toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<SinglePostDrawer postId="author:post-1" />);
    expect(container).toMatchSnapshot();
  });
});
