import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PostDetailLayout from './layout';

const mockUseSelectedLayoutSegment = vi.fn<() => string | null>(() => null);

vi.mock('next/navigation', () => ({
  useParams: () => ({ userId: 'author', postId: 'post-id' }),
  useSelectedLayoutSegment: () => mockUseSelectedLayoutSegment(),
}));

vi.mock('@/organisms/PostPageShell/PostPageShell', () => ({
  PostPageShell: ({ children, postId }: { children: React.ReactNode; postId: string }) => (
    <div data-testid="post-page-shell" data-post-id={postId}>
      {children}
    </div>
  ),
}));

describe('PostDetailLayout', () => {
  beforeEach(() => {
    mockUseSelectedLayoutSegment.mockReturnValue(null);
  });

  it('wraps the post page in the standard post shell', () => {
    render(
      <PostDetailLayout>
        <div>Post page</div>
      </PostDetailLayout>,
    );

    expect(screen.getByTestId('post-page-shell')).toHaveAttribute('data-post-id', 'author:post-id');
  });

  it('renders the reply route without the post shell behind it', () => {
    mockUseSelectedLayoutSegment.mockReturnValue('reply');

    render(
      <PostDetailLayout>
        <div>Reply page</div>
      </PostDetailLayout>,
    );

    expect(screen.getByText('Reply page')).toBeInTheDocument();
    expect(screen.queryByTestId('post-page-shell')).not.toBeInTheDocument();
  });
});
