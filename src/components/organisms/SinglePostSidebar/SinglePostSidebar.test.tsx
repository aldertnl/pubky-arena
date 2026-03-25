import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SinglePostSidebar } from './SinglePostSidebar';

vi.mock('@/atoms', () => ({
  Container: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="container" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/organisms', () => ({
  FeedbackCard: () => <div data-testid="feedback-card">FeedbackCard</div>,
}));

vi.mock('../SinglePostParticipants', () => ({
  SinglePostParticipants: ({ postId }: { postId: string }) => (
    <div data-testid="single-post-participants" data-post-id={postId}>
      SinglePostParticipants
    </div>
  ),
}));

describe('SinglePostSidebar', () => {
  it('renders participants and feedback card', () => {
    render(<SinglePostSidebar postId="author:post-1" />);

    expect(screen.getByTestId('single-post-participants')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-card')).toBeInTheDocument();
  });

  it('passes postId to SinglePostParticipants', () => {
    render(<SinglePostSidebar postId="author:post-123" />);

    expect(screen.getByTestId('single-post-participants')).toHaveAttribute('data-post-id', 'author:post-123');
  });

  it('matches snapshot', () => {
    const { container } = render(<SinglePostSidebar postId="author:post-1" />);
    expect(container).toMatchSnapshot();
  });
});
