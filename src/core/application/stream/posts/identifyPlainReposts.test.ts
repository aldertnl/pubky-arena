import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import * as Core from '@/core';

function makeDetails(id: string, overrides: Partial<Core.PostDetailsModelSchema> = {}): Core.PostDetailsModelSchema {
  return {
    id,
    content: '',
    kind: 'short',
    uri: `pubky://${id.split(':')[0]}/pub/pubky.app/posts/${id.split(':')[1]}`,
    indexed_at: 1000,
    attachments: null,
    ...overrides,
  };
}

function makeRelationships(
  id: string,
  overrides: Partial<Core.PostRelationshipsModelSchema> = {},
): Core.PostRelationshipsModelSchema {
  return {
    id,
    replied: null,
    reposted: null,
    mentioned: [],
    ...overrides,
  };
}

type ChainGraph = Record<
  string,
  { details: Core.PostDetailsModelSchema | null; rel: Core.PostRelationshipsModelSchema | null }
>;

function stubChainGraph(spyReadDetails: Mock, spyReadRelationships: Mock, graph: ChainGraph) {
  spyReadDetails.mockImplementation(({ postId }: { postId: string }) =>
    Promise.resolve(graph[postId]?.details ?? null),
  );
  spyReadRelationships.mockImplementation((postId: string) => Promise.resolve(graph[postId]?.rel ?? null));
}

describe('PostStreamApplication.identifyPlainReposts', () => {
  const spyReadDetailsByIds = vi.spyOn(Core.LocalPostService, 'readDetailsByIds');
  const spyReadRelationshipsByIds = vi.spyOn(Core.LocalPostService, 'readRelationshipsByIds');
  const spyReadDetails = vi.spyOn(Core.LocalPostService, 'readDetails');
  const spyReadRelationships = vi.spyOn(Core.LocalPostService, 'readRelationships');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Core.PostApplication, 'getOrFetch').mockResolvedValue(null);
  });

  it('returns empty map for empty input', async () => {
    const result = await Core.PostStreamApplication.identifyPlainReposts([]);
    expect(result.size).toBe(0);
    expect(spyReadDetailsByIds).not.toHaveBeenCalled();
  });

  it('skips non-repost posts', async () => {
    const postIds = ['alice:post1', 'bob:post2'];
    spyReadDetailsByIds.mockResolvedValue([
      makeDetails('alice:post1', { content: 'Hello world' }),
      makeDetails('bob:post2', { content: 'Another post' }),
    ]);
    spyReadRelationshipsByIds.mockResolvedValue([makeRelationships('alice:post1'), makeRelationships('bob:post2')]);

    const result = await Core.PostStreamApplication.identifyPlainReposts(postIds);
    expect(result.size).toBe(0);
  });

  it('skips quote reposts (has content)', async () => {
    const postIds = ['alice:repost1'];
    spyReadDetailsByIds.mockResolvedValue([makeDetails('alice:repost1', { content: 'My thoughts on this' })]);
    spyReadRelationshipsByIds.mockResolvedValue([
      makeRelationships('alice:repost1', {
        reposted: 'pubky://bob/pub/pubky.app/posts/orig1',
      }),
    ]);

    const result = await Core.PostStreamApplication.identifyPlainReposts(postIds);
    expect(result.size).toBe(0);
  });

  it('skips reposts with attachments', async () => {
    const postIds = ['alice:repost1'];
    spyReadDetailsByIds.mockResolvedValue([makeDetails('alice:repost1', { content: '', attachments: ['img.jpg'] })]);
    spyReadRelationshipsByIds.mockResolvedValue([
      makeRelationships('alice:repost1', {
        reposted: 'pubky://bob/pub/pubky.app/posts/orig1',
      }),
    ]);

    const result = await Core.PostStreamApplication.identifyPlainReposts(postIds);
    expect(result.size).toBe(0);
  });

  it('identifies a simple plain repost', async () => {
    const postIds = ['alice:repost1'];
    spyReadDetailsByIds.mockResolvedValue([makeDetails('alice:repost1', { content: '', indexed_at: 2000 })]);
    spyReadRelationshipsByIds.mockResolvedValue([
      makeRelationships('alice:repost1', {
        reposted: 'pubky://bob/pub/pubky.app/posts/orig1',
      }),
    ]);
    stubChainGraph(spyReadDetails, spyReadRelationships, {
      'alice:repost1': {
        details: makeDetails('alice:repost1', { content: '', indexed_at: 2000 }),
        rel: makeRelationships('alice:repost1', {
          reposted: 'pubky://bob/pub/pubky.app/posts/orig1',
        }),
      },
      'bob:orig1': {
        details: makeDetails('bob:orig1', { content: 'root' }),
        rel: makeRelationships('bob:orig1', { reposted: null }),
      },
    });

    const result = await Core.PostStreamApplication.identifyPlainReposts(postIds);
    expect(result.size).toBe(1);
    expect(result.get('alice:repost1')).toEqual({
      originalPostId: 'bob:orig1',
      indexedAt: 2000,
    });
  });

  it('identifies multiple plain reposts of the same original', async () => {
    const postIds = ['alice:repost1', 'charlie:repost2', 'dave:post3'];
    const repostedUri = 'pubky://bob/pub/pubky.app/posts/orig1';

    spyReadDetailsByIds.mockResolvedValue([
      makeDetails('alice:repost1', { content: '' }),
      makeDetails('charlie:repost2', { content: '' }),
      makeDetails('dave:post3', { content: 'Original post' }),
    ]);
    spyReadRelationshipsByIds.mockResolvedValue([
      makeRelationships('alice:repost1', { reposted: repostedUri }),
      makeRelationships('charlie:repost2', { reposted: repostedUri }),
      makeRelationships('dave:post3'),
    ]);
    stubChainGraph(spyReadDetails, spyReadRelationships, {
      'alice:repost1': {
        details: makeDetails('alice:repost1', { content: '' }),
        rel: makeRelationships('alice:repost1', { reposted: repostedUri }),
      },
      'charlie:repost2': {
        details: makeDetails('charlie:repost2', { content: '' }),
        rel: makeRelationships('charlie:repost2', { reposted: repostedUri }),
      },
      'bob:orig1': {
        details: makeDetails('bob:orig1', { content: 'root' }),
        rel: makeRelationships('bob:orig1', { reposted: null }),
      },
    });

    const result = await Core.PostStreamApplication.identifyPlainReposts(postIds);
    expect(result.size).toBe(2);
    expect(result.get('alice:repost1')?.originalPostId).toBe('bob:orig1');
    expect(result.get('charlie:repost2')?.originalPostId).toBe('bob:orig1');
    expect(result.has('dave:post3')).toBe(false);
  });

  it('skips posts with undefined details or relationships', async () => {
    const postIds = ['alice:repost1', 'bob:repost2'];
    spyReadDetailsByIds.mockResolvedValue([undefined, makeDetails('bob:repost2', { content: '' })]);
    spyReadRelationshipsByIds.mockResolvedValue([
      makeRelationships('alice:repost1', { reposted: 'pubky://x/pub/pubky.app/posts/y' }),
      undefined,
    ]);

    const result = await Core.PostStreamApplication.identifyPlainReposts(postIds);
    expect(result.size).toBe(0);
  });

  it('treats whitespace-only content as plain repost', async () => {
    const postIds = ['alice:repost1'];
    spyReadDetailsByIds.mockResolvedValue([makeDetails('alice:repost1', { content: '   \n\t  ' })]);
    spyReadRelationshipsByIds.mockResolvedValue([
      makeRelationships('alice:repost1', {
        reposted: 'pubky://bob/pub/pubky.app/posts/orig1',
      }),
    ]);
    stubChainGraph(spyReadDetails, spyReadRelationships, {
      'alice:repost1': {
        details: makeDetails('alice:repost1', { content: '   \n\t  ' }),
        rel: makeRelationships('alice:repost1', {
          reposted: 'pubky://bob/pub/pubky.app/posts/orig1',
        }),
      },
      'bob:orig1': {
        details: makeDetails('bob:orig1', { content: 'root' }),
        rel: makeRelationships('bob:orig1', { reposted: null }),
      },
    });

    const result = await Core.PostStreamApplication.identifyPlainReposts(postIds);
    expect(result.size).toBe(1);
  });
});

describe('PostStreamApplication.identifyPlainReposts — repost chain resolution', () => {
  const spyReadDetailsByIds = vi.spyOn(Core.LocalPostService, 'readDetailsByIds');
  const spyReadRelationshipsByIds = vi.spyOn(Core.LocalPostService, 'readRelationshipsByIds');
  const spyReadDetails = vi.spyOn(Core.LocalPostService, 'readDetails');
  const spyReadRelationships = vi.spyOn(Core.LocalPostService, 'readRelationships');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Core.PostApplication, 'getOrFetch').mockResolvedValue(null);
  });

  it('resolves a 2-deep repost chain (A→B→C)', async () => {
    const postIds = ['alice:repost1'];

    spyReadDetailsByIds.mockResolvedValue([makeDetails('alice:repost1', { content: '', indexed_at: 3000 })]);
    spyReadRelationshipsByIds.mockResolvedValue([
      makeRelationships('alice:repost1', {
        reposted: 'pubky://bob/pub/pubky.app/posts/repost2',
      }),
    ]);

    stubChainGraph(spyReadDetails, spyReadRelationships, {
      'alice:repost1': {
        details: makeDetails('alice:repost1', { content: '', indexed_at: 3000 }),
        rel: makeRelationships('alice:repost1', {
          reposted: 'pubky://bob/pub/pubky.app/posts/repost2',
        }),
      },
      'bob:repost2': {
        details: makeDetails('bob:repost2', { content: '' }),
        rel: makeRelationships('bob:repost2', {
          reposted: 'pubky://charlie/pub/pubky.app/posts/orig',
        }),
      },
      'charlie:orig': {
        details: makeDetails('charlie:orig', { content: 'root' }),
        rel: makeRelationships('charlie:orig', { reposted: null }),
      },
    });

    const result = await Core.PostStreamApplication.identifyPlainReposts(postIds);
    expect(result.size).toBe(1);
    expect(result.get('alice:repost1')?.originalPostId).toBe('charlie:orig');
  });

  it('stops at a quote repost in the chain', async () => {
    const postIds = ['alice:repost1'];

    spyReadDetailsByIds.mockResolvedValue([makeDetails('alice:repost1', { content: '' })]);
    spyReadRelationshipsByIds.mockResolvedValue([
      makeRelationships('alice:repost1', {
        reposted: 'pubky://bob/pub/pubky.app/posts/quote1',
      }),
    ]);

    stubChainGraph(spyReadDetails, spyReadRelationships, {
      'alice:repost1': {
        details: makeDetails('alice:repost1', { content: '' }),
        rel: makeRelationships('alice:repost1', {
          reposted: 'pubky://bob/pub/pubky.app/posts/quote1',
        }),
      },
      'bob:quote1': {
        details: makeDetails('bob:quote1', { content: 'My thoughts' }),
        rel: makeRelationships('bob:quote1', {
          reposted: 'pubky://charlie/pub/pubky.app/posts/orig',
        }),
      },
    });

    const result = await Core.PostStreamApplication.identifyPlainReposts(postIds);
    expect(result.size).toBe(1);
    expect(result.get('alice:repost1')?.originalPostId).toBe('bob:quote1');
  });

  it('handles cycle in repost chain', async () => {
    const postIds = ['alice:repost1'];

    spyReadDetailsByIds.mockResolvedValue([makeDetails('alice:repost1', { content: '' })]);
    spyReadRelationshipsByIds.mockResolvedValue([
      makeRelationships('alice:repost1', {
        reposted: 'pubky://bob/pub/pubky.app/posts/repost2',
      }),
    ]);

    stubChainGraph(spyReadDetails, spyReadRelationships, {
      'alice:repost1': {
        details: makeDetails('alice:repost1', { content: '' }),
        rel: makeRelationships('alice:repost1', {
          reposted: 'pubky://bob/pub/pubky.app/posts/repost2',
        }),
      },
      'bob:repost2': {
        details: makeDetails('bob:repost2', { content: '' }),
        rel: makeRelationships('bob:repost2', {
          reposted: 'pubky://alice/pub/pubky.app/posts/repost1',
        }),
      },
    });

    const result = await Core.PostStreamApplication.identifyPlainReposts(postIds);
    expect(result.size).toBe(1);
    expect(result.get('alice:repost1')?.originalPostId).toBe('alice:repost1');
  });

  it('handles invalid URI in repost chain gracefully', async () => {
    const postIds = ['alice:repost1'];

    spyReadDetailsByIds.mockResolvedValue([makeDetails('alice:repost1', { content: '' })]);
    spyReadRelationshipsByIds.mockResolvedValue([
      makeRelationships('alice:repost1', {
        reposted: 'not-a-valid-uri',
      }),
    ]);

    stubChainGraph(spyReadDetails, spyReadRelationships, {
      'alice:repost1': {
        details: makeDetails('alice:repost1', { content: '' }),
        rel: makeRelationships('alice:repost1', { reposted: 'not-a-valid-uri' }),
      },
    });

    const result = await Core.PostStreamApplication.identifyPlainReposts(postIds);
    expect(result.size).toBe(0);
  });

  it('handles missing details during chain resolution', async () => {
    const postIds = ['alice:repost1'];

    spyReadDetailsByIds.mockResolvedValue([makeDetails('alice:repost1', { content: '' })]);
    spyReadRelationshipsByIds.mockResolvedValue([
      makeRelationships('alice:repost1', {
        reposted: 'pubky://bob/pub/pubky.app/posts/repost2',
      }),
    ]);

    stubChainGraph(spyReadDetails, spyReadRelationships, {
      'alice:repost1': {
        details: makeDetails('alice:repost1', { content: '' }),
        rel: makeRelationships('alice:repost1', {
          reposted: 'pubky://bob/pub/pubky.app/posts/repost2',
        }),
      },
      'bob:repost2': {
        details: null,
        rel: makeRelationships('bob:repost2', {
          reposted: 'pubky://charlie/pub/pubky.app/posts/orig',
        }),
      },
    });

    const result = await Core.PostStreamApplication.identifyPlainReposts(postIds);
    expect(result.size).toBe(1);
    expect(result.get('alice:repost1')?.originalPostId).toBe('bob:repost2');
  });
});
