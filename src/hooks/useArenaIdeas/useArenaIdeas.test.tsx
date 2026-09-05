import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TPostSnapshot } from '@/application/post/post.types';
import { PostController } from '@/controllers/post/post';
import type { ArenaIdea } from '@/libs/arena/arena';
import { VRT_FEED_POSTS } from '@/test/fixtures/feed/posts';
import { useArenaIdeas } from './useArenaIdeas';

const state = vi.hoisted(() => ({
  muted: new Set<string>(),
  read: async (): Promise<{ ideas: ArenaIdea[]; error: string | null }> => ({ ideas: [], error: null }),
}));
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (query: typeof state.read) => {
    state.read = query;
    return { ideas: [], error: null };
  },
}));
vi.mock('@/hooks/useMutedUsers/useMutedUsers', () => ({ useMutedUsers: () => ({ mutedUserIdSet: state.muted }) }));
vi.mock('@/controllers/post/post', () => ({
  PostController: {
    getManySnapshots: vi.fn(),
  },
}));

const fixture = VRT_FEED_POSTS[0];
const { author, ...details } = fixture.details;
const model = { ...details, id: fixture.compositeId, is_blurred: false, is_moderated: false };
let snapshot: TPostSnapshot;

describe('Arena local data projection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.muted.clear();
    snapshot = {
      details: model,
      counts: { ...fixture.counts, id: fixture.compositeId },
      relationships: { ...fixture.relationships, id: fixture.compositeId },
    };
    vi.mocked(PostController.getManySnapshots).mockImplementation(
      async () => new Map([[fixture.compositeId, snapshot]]),
    );
  });

  it('gets the author from the composite ID and counts distinct tag labels', async () => {
    renderHook(() => useArenaIdeas([fixture.compositeId, fixture.compositeId]));
    const result = await state.read();
    expect(result.ideas).toHaveLength(1);
    expect(PostController.getManySnapshots).toHaveBeenCalledExactlyOnceWith({ compositeIds: [fixture.compositeId] });
    expect(result.ideas[0]).toMatchObject({
      author,
      kind: model.kind,
      indexedAt: model.indexed_at,
      tags: fixture.counts.unique_tags,
      replies: fixture.counts.replies,
      reposts: fixture.counts.reposts,
    });
  });

  it('does not expose muted, deleted, or missing posts as contenders', async () => {
    renderHook(() => useArenaIdeas([fixture.compositeId]));
    state.muted.add(author);
    expect((await state.read()).ideas).toEqual([]);
    state.muted.clear();
    snapshot = { ...snapshot, details: { ...model, content: '[DELETED]' } };
    expect((await state.read()).ideas).toEqual([]);
    vi.mocked(PostController.getManySnapshots).mockResolvedValue(new Map());
    expect((await state.read()).ideas).toEqual([]);
  });

  it('preserves content warnings and resolves an actual parent relationship', async () => {
    snapshot.details = { ...model, is_blurred: true, content: 'Hidden content' };
    snapshot.relationships = {
      ...fixture.relationships,
      id: fixture.compositeId,
      replied: `pubky://${author}/pub/pubky.app/posts/parent`,
    };
    renderHook(() => useArenaIdeas([fixture.compositeId]));
    expect((await state.read()).ideas[0]).toMatchObject({ preview: 'Content warning', replyTo: `${author}:parent` });
  });

  it('reuses unchanged projections but refreshes counts, content and moderation', async () => {
    renderHook(() => useArenaIdeas([fixture.compositeId]));
    const first = (await state.read()).ideas[0];
    expect((await state.read()).ideas[0]).toBe(first);
    snapshot = { ...snapshot, counts: { ...snapshot.counts!, replies: 99 } };
    const updated = (await state.read()).ideas[0];
    expect(updated.replies).toBe(99);
    expect(updated.preview).toBe(first.preview);
    snapshot = { ...snapshot, details: { ...model, content: 'Edited post' } };
    expect((await state.read()).ideas[0].preview).toBe('Edited post');
    snapshot = { ...snapshot, details: { ...snapshot.details, is_blurred: true } };
    expect((await state.read()).ideas[0].preview).toBe('Content warning');
  });
});
