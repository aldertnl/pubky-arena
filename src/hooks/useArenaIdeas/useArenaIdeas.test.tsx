import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TPostSnapshot } from '@/application/post/post.types';
import { PostController } from '@/controllers/post/post';
import type { ArenaIdea } from '@/libs/arena/arena';
import { VRT_FEED_POSTS } from '@/test/fixtures/feed/posts';
import { useArenaIdeas } from './useArenaIdeas';

const state = vi.hoisted(() => ({
  muted: new Set<string>(),
  projection: { ideas: [] as ArenaIdea[], error: null as string | null, idsKey: null as string | null },
  read: async (): Promise<{ ideas: ArenaIdea[]; error: string | null; idsKey: string | null }> => ({
    ideas: [],
    error: null,
    idsKey: null,
  }),
}));
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (query: typeof state.read) => {
    state.read = query;
    return state.projection;
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
    state.projection = { ideas: [], error: null, idsKey: null };
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

  it('distinguishes a pending new page from an already-read page with no eligible posts', async () => {
    const { result, rerender } = renderHook(({ ids }) => useArenaIdeas(ids), {
      initialProps: { ids: [fixture.compositeId] },
    });
    expect(result.current.loading).toBe(true);
    state.projection = await state.read();
    rerender({ ids: [fixture.compositeId] });
    expect(result.current.loading).toBe(false);
    rerender({ ids: [fixture.compositeId, 'person:missing'] });
    expect(result.current.loading).toBe(true);
    vi.mocked(PostController.getManySnapshots).mockResolvedValue(new Map());
    state.projection = await state.read();
    rerender({ ids: [fixture.compositeId, 'person:missing'] });
    expect(result.current).toMatchObject({ loading: false, ideas: [] });
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

  it('includes muted candidates only when requested, preserving deletion and content warnings', async () => {
    state.muted.add(author);
    renderHook(() => useArenaIdeas([fixture.compositeId], { includeMuted: true }));
    expect((await state.read()).ideas).toHaveLength(1);
    snapshot.details = { ...model, is_blurred: true, content: 'Hidden content' };
    expect((await state.read()).ideas[0].preview).toBe('Content warning');
    snapshot.details = { ...model, content: '[DELETED]' };
    expect((await state.read()).ideas).toEqual([]);
    expect(state.muted.has(author)).toBe(true);
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
