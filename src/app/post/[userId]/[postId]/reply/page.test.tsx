import { describe, expect, it, vi } from 'vitest';
import PostReplyPage from './page';

vi.mock('@/templates/Post/Reply/ReplyPage', () => ({
  ReplyPage: ({ postId }: { postId: string }) => <div data-testid="reply-page" data-post-id={postId} />,
}));

describe('PostReplyPage', () => {
  it('renders the route-backed composer for the target composite post id', async () => {
    const element = await PostReplyPage({
      params: Promise.resolve({ userId: 'author-id', postId: 'post-id' }),
    });

    expect(element.props.postId).toBe('author-id:post-id');
  });
});
