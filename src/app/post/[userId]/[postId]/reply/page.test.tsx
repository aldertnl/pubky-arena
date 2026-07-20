import { describe, expect, it, vi } from 'vitest';
import PostReplyPage from './page';

vi.mock('@/templates/Post/Reply/ReplyPage', () => ({
  ReplyPage: ({ postId }: { postId: string }) => <div data-testid="reply-page" data-post-id={postId} />,
}));

describe('PostReplyPage', () => {
  it('renders the reply page for a direct route', async () => {
    const element = await PostReplyPage({
      params: Promise.resolve({ userId: 'author', postId: 'post-id' }),
    });

    expect(element.props.postId).toBe('author:post-id');
  });
});
