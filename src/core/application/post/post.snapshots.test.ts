import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostApplication } from '@/application/post/post';
import { ModerationController } from '@/controllers/moderation/moderation';
import { LocalPostService } from '@/services/local/post/post';
import { VRT_FEED_POSTS } from '@/test/fixtures/feed/posts';

vi.mock('@/services/local/post/post', () => ({
  LocalPostService: {
    readDetailsByIds: vi.fn(),
    readCountsByIds: vi.fn(),
    readRelationshipsByIds: vi.fn(),
  },
}));
vi.mock('@/controllers/moderation/moderation', () => ({ ModerationController: { enrichPosts: vi.fn() } }));

describe('Bulk local post snapshots', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps counts and relationships aligned across missing posts and batches moderation', async () => {
    const posts = VRT_FEED_POSTS.slice(0, 2).map((fixture) => {
      const { author: _author, ...details } = fixture.details;
      return { ...details, id: fixture.compositeId };
    });
    const ids = [posts[0].id, 'missing:post', posts[1].id];
    const counts = VRT_FEED_POSTS.slice(0, 2).map((fixture) => ({ ...fixture.counts, id: fixture.compositeId }));
    const relationships = { ...VRT_FEED_POSTS[1].relationships, id: posts[1].id };
    vi.mocked(LocalPostService.readDetailsByIds).mockResolvedValue([posts[0], undefined, posts[1]]);
    vi.mocked(LocalPostService.readCountsByIds).mockResolvedValue([counts[0], undefined, counts[1]]);
    vi.mocked(LocalPostService.readRelationshipsByIds).mockResolvedValue([undefined, undefined, relationships]);
    vi.mocked(ModerationController.enrichPosts).mockResolvedValue(
      posts.map((post) => ({
        ...post,
        is_blurred: true,
        is_moderated: true,
      })),
    );

    const result = await PostApplication.getManySnapshots({ compositeIds: [...ids, ids[0]] });
    expect(LocalPostService.readDetailsByIds).toHaveBeenCalledExactlyOnceWith(ids);
    expect(LocalPostService.readCountsByIds).toHaveBeenCalledExactlyOnceWith(ids);
    expect(LocalPostService.readRelationshipsByIds).toHaveBeenCalledExactlyOnceWith(ids);
    expect(ModerationController.enrichPosts).toHaveBeenCalledExactlyOnceWith(posts);
    expect(result.has('missing:post')).toBe(false);
    expect(result.get(posts[0].id)?.relationships).toBeNull();
    expect(result.get(posts[1].id)).toMatchObject({
      details: { id: posts[1].id, is_blurred: true },
      counts: counts[1],
      relationships,
    });
  });

  it('does no database work for an empty candidate list', async () => {
    expect(await PostApplication.getManySnapshots({ compositeIds: [] })).toEqual(new Map());
    expect(LocalPostService.readDetailsByIds).not.toHaveBeenCalled();
    expect(LocalPostService.readCountsByIds).not.toHaveBeenCalled();
    expect(ModerationController.enrichPosts).not.toHaveBeenCalled();
  });
});
