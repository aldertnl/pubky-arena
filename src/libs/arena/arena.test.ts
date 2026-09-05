import { describe, expect, it } from 'vitest';
import { UserStreamTimeframe } from '@/services/nexus/nexus.types';
import { createPostStreamParams } from '@/services/nexus/stream/posts/postStream.utils';
import { CONTENT, REACH } from '@/stores/home/home.types';
import {
  ARENA_PAGE_SIZE,
  type ArenaIdea,
  filterArenaIdeasByContent,
  filterArenaIdeasByTimeframe,
  getArenaCandidateSorting,
  getArenaCandidateStreamId,
  getArenaLead,
  getArenaVisibleIdeas,
  rankArenaIdeas,
  rankArenaIdeasForTimeframe,
  shouldLoadMoreArenaCandidates,
  shouldLoadMoreArenaTimeframe,
} from './arena';

const idea = (id: string, tags: number, replies: number, replyTo: string | null = null): ArenaIdea => ({
  id,
  author: id.split(':')[0],
  preview: 'An idea',
  kind: 'short',
  indexedAt: 0,
  tags,
  replies,
  reposts: 0,
  replyTo,
});

describe('Arena standings', () => {
  it('combines weighted tags, replies, and reposts without zeroing posts missing one kind of engagement', () => {
    const ranked = rankArenaIdeas(
      [
        idea('a:tags', 14, 0),
        { ...idea('b:mixed', 4, 5), reposts: 6 },
        idea('c:replies', 0, 13),
        idea('d:empty', 0, 0),
      ],
      'popular',
    );
    expect(ranked.map(({ id, score }) => ({ id, score }))).toEqual([
      { id: 'c:replies', score: 52 },
      { id: 'b:mixed', score: 42 },
      { id: 'a:tags', score: 14 },
      { id: 'd:empty', score: 0 },
    ]);
    expect(getArenaLead(ranked, 'popular')).toBe('leading by 10 points');
  });

  it('uses combined scores for reply leads and recognizes equal totals with different engagement mixes', () => {
    const original = { ...idea('a:original', 10, 5), reposts: 1 };
    const reply = { ...idea('b:reply', 8, 8, original.id), reposts: 4 };
    expect(getArenaLead(rankArenaIdeas([original, reply], 'popular'), 'popular')).toBe('leading by 19 points');
    const tied = rankArenaIdeas([reply, idea('c:tied', 52, 0)], 'popular');
    expect(tied.map(({ rank }) => rank)).toEqual([1, 2]);
    expect(getArenaLead(tied, 'popular')).toBe('tied for lead');
  });

  it('retains valid popularity contributions when another counter is invalid', () => {
    const ranked = rankArenaIdeas(
      [{ ...idea('a:invalid', Number.NaN, 5), reposts: Number.POSITIVE_INFINITY }, idea('b:negative', -2, 1)],
      'popular',
    );
    expect(ranked.map(({ score }) => score)).toEqual([20, 4]);
  });

  it('ranks repost counts with unique places and the correct lead unit', () => {
    const entries = [
      { ...idea('a:1', 100, 20), reposts: 2 },
      { ...idea('b:1', 1, 0), reposts: 3 },
      { ...idea('c:1', 2, 1), reposts: 2 },
    ];
    const ranked = rankArenaIdeas(entries, 'reposts');
    expect(ranked.map(({ id, rank }) => ({ id, rank }))).toEqual([
      { id: 'b:1', rank: 1 },
      { id: 'a:1', rank: 2 },
      { id: 'c:1', rank: 3 },
    ]);
    expect(getArenaLead(ranked, 'reposts')).toBe('leading by 1 repost');
  });

  it('orders Most recent by indexed time regardless of engagement, without a competitive lead', () => {
    const entries = [
      { ...idea('a:old', 100, 50), indexedAt: 1 },
      { ...idea('c:new', 0, 0), indexedAt: 3 },
      { ...idea('b:new', 0, 0), indexedAt: 3 },
    ];
    const ranked = rankArenaIdeas(entries, 'newest');
    expect(ranked.map(({ id, rank }) => ({ id, rank }))).toEqual([
      { id: 'b:new', rank: 1 },
      { id: 'c:new', rank: 2 },
      { id: 'a:old', rank: 3 },
    ]);
    expect(getArenaLead(ranked, 'newest')).toBe('');
  });

  it('keeps the selection on the floor without displacing the leader', () => {
    const ranked = rankArenaIdeas(
      Array.from({ length: 11 }, (_, i) => idea(`a:${i}`, 11 - i, 0)),
      'tags',
    );
    const visible = getArenaVisibleIdeas(ranked, 'a:10');
    expect(visible).toHaveLength(10);
    expect(visible[0].id).toBe('a:0');
    expect(visible.map((entry) => entry.id)).toContain('a:10');
  });

  it('lets a reply take the lead from its original, and switches the winner with the metric', () => {
    const entries = [idea('a:original', 42, 18), idea('b:reply', 60, 12, 'a:original')];
    const byTags = rankArenaIdeas(entries, 'tags');
    expect(byTags.map((entry) => entry.id)).toEqual(['b:reply', 'a:original']);
    expect(getArenaLead(byTags, 'tags')).toBe('leading by 18 tags');
    const byReplies = rankArenaIdeas(entries, 'replies');
    expect(byReplies[0].id).toBe('a:original');
    expect(getArenaLead(byReplies, 'replies')).toBe('leading by 6 replies');
  });

  it('gives tied scores unique stable positions without inventing an engagement lead', () => {
    const entries = [idea('c:1', 2, 0), idea('b:1', 5, 0), idea('a:1', 5, 0)];
    const ranked = rankArenaIdeas(entries, 'tags');
    expect(ranked.map(({ id, rank }) => ({ id, rank }))).toEqual([
      { id: 'a:1', rank: 1 },
      { id: 'b:1', rank: 2 },
      { id: 'c:1', rank: 3 },
    ]);
    expect(rankArenaIdeas([...entries].reverse(), 'tags')).toEqual(ranked);
    expect(getArenaLead(ranked, 'tags')).toBe('tied for lead');
    expect(entries[0].id).toBe('c:1');
  });

  it('deduplicates contenders and handles zero scores without inventing a lead', () => {
    const entries = [idea('a:1', 0, 0), idea('a:1', 0, 0)];
    expect(rankArenaIdeas(entries, 'tags')).toHaveLength(1);
    expect(getArenaLead(rankArenaIdeas(entries, 'tags'), 'tags')).toBe('');
    expect(getArenaLead([], 'tags')).toBe('');
  });

  it('only describes a reply beating its own parent when that parent is loaded', () => {
    const entries = [idea('b:reply', 20, 1, 'missing:parent'), idea('a:other', 15, 2)];
    expect(getArenaLead(rankArenaIdeas(entries, 'tags'), 'tags')).toBe('leading by 5 tags');
  });
});

describe('Arena All topics', () => {
  it.each([
    [REACH.ALL, 'all'],
    [REACH.NETWORK, 'wot'],
    [REACH.FOLLOWING, 'following'],
    [REACH.FRIENDS, 'friends'],
  ] as const)('removes the tag parameter and honors %s reach', (reach, source) => {
    const streamId = getArenaCandidateStreamId(null, 'popular', UserStreamTimeframe.ALL_TIME, CONTENT.ALL, reach);
    const { params, invokeEndpoint } = createPostStreamParams({
      streamId,
      limit: 24,
      streamHead: 0,
      streamTail: 0,
      viewerId: 'viewer',
    });
    expect(invokeEndpoint).toBe(source);
    expect(params).toMatchObject({ sorting: 'total_engagement', viewer_id: 'viewer' });
    expect(params.tags).toBeUndefined();
    expect(params.kind).toBeUndefined();
  });

  it('retains timeframe-correct loading and local reply-inclusive content filtering for All', () => {
    const streamId = getArenaCandidateStreamId(null, 'popular', UserStreamTimeframe.THIS_WEEK, CONTENT.SHORT);
    const { params } = createPostStreamParams({ streamId, limit: 50, streamHead: 0, streamTail: 0, viewerId: null });
    expect(params.sorting).toBe('timeline');
    expect(params.tags).toBeUndefined();
    expect(params.kind).toBeUndefined();
  });

  it('still uses the collection stream without requiring a tag', () => {
    const streamId = getArenaCandidateStreamId(null, 'popular', UserStreamTimeframe.ALL_TIME, CONTENT.COLLECTIONS);
    const { params } = createPostStreamParams({ streamId, limit: 24, streamHead: 0, streamTail: 0, viewerId: null });
    expect(params.kind).toBe('collection');
    expect(params.tags).toBeUndefined();
  });

  it('keeps an actual tag called all filtered and preserves the existing tagged reach behavior', () => {
    const streamId = getArenaCandidateStreamId(
      'all',
      'popular',
      UserStreamTimeframe.ALL_TIME,
      CONTENT.ALL,
      REACH.NETWORK,
    );
    const { params, invokeEndpoint } = createPostStreamParams({
      streamId,
      limit: 24,
      streamHead: 0,
      streamTail: 0,
      viewerId: null,
    });
    expect(params.tags).toBe('all');
    expect(invokeEndpoint).toBe('all');
  });
});

describe('Arena content filters include replies', () => {
  const now = Date.UTC(2026, 8, 5, 12);
  const day = 24 * 60 * 60 * 1000;
  const kinds = [
    [CONTENT.SHORT, 'short'],
    [CONTENT.LONG, 'long'],
    [CONTENT.IMAGES, 'image'],
    [CONTENT.VIDEOS, 'video'],
    [CONTENT.LINKS, 'link'],
    [CONTENT.FILES, 'file'],
    [CONTENT.COLLECTIONS, 'collection'],
  ] as const;
  const entries = kinds.flatMap(([, kind]) => [
    { ...idea(`a:${kind}-original`, 1, 0), kind, indexedAt: now },
    { ...idea(`b:${kind}-reply`, 2, 1, `a:${kind}-original`), kind, indexedAt: now },
  ]);

  it.each(kinds)('keeps %s originals and replies without including other kinds', (content, kind) => {
    expect(filterArenaIdeasByContent(entries, content).map(({ id }) => id)).toEqual([
      `a:${kind}-original`,
      `b:${kind}-reply`,
    ]);
  });

  it('keeps every loaded kind under Content', () => {
    expect(filterArenaIdeasByContent(entries, CONTENT.ALL)).toBe(entries);
  });

  it.each(kinds.filter(([content]) => content !== CONTENT.COLLECTIONS))(
    'does not send the reply-excluding Nexus kind parameter for %s',
    (content) => {
      const streamId = getArenaCandidateStreamId('answer', 'replies', UserStreamTimeframe.THIS_WEEK, content);
      const { params, invokeEndpoint } = createPostStreamParams({
        streamId,
        limit: 50,
        streamHead: 0,
        streamTail: 0,
        viewerId: null,
      });
      expect(invokeEndpoint).toBe('all');
      expect(params).toMatchObject({ sorting: 'timeline', tags: 'answer', limit: 50 });
      expect(params.kind).toBeUndefined();
    },
  );

  it('retains the dedicated Collections stream instead of losing collections to the all-kind feed exclusion', () => {
    const streamId = getArenaCandidateStreamId('answer', 'popular', UserStreamTimeframe.ALL_TIME, CONTENT.COLLECTIONS);
    const { params } = createPostStreamParams({ streamId, limit: 24, streamHead: 0, streamTail: 0, viewerId: null });
    expect(params).toMatchObject({ sorting: 'total_engagement', tags: 'answer', kind: 'collection' });
  });

  it('lets a matching reply lead Posts while excluding old replies and other content types', () => {
    const candidates = [...entries, { ...idea('c:old-reply', 999, 999, 'a:short-original'), indexedAt: now - 8 * day }];
    const ranked = rankArenaIdeasForTimeframe(
      filterArenaIdeasByContent(candidates, CONTENT.SHORT),
      'replies',
      UserStreamTimeframe.THIS_WEEK,
      now,
    );
    expect(ranked.map(({ id, rank }) => ({ id, rank }))).toEqual([
      { id: 'b:short-reply', rank: 1 },
      { id: 'a:short-original', rank: 2 },
    ]);
  });

  it('scans nonmatching All-time pages until a full page of matching originals and replies is available', () => {
    const nonmatching = Array.from({ length: ARENA_PAGE_SIZE }, (_, i) => ({
      ...idea(`a:image-${i}`, 99, 0),
      kind: 'image',
    }));
    const matching = Array.from({ length: ARENA_PAGE_SIZE }, (_, i) => idea(`b:reply-${i}`, 1, 1, 'a:parent'));
    const shouldLoad = (candidates: ArenaIdea[]) =>
      shouldLoadMoreArenaCandidates(candidates, UserStreamTimeframe.ALL_TIME, now, CONTENT.SHORT);
    expect(shouldLoad(nonmatching)).toBe(true);
    expect(shouldLoad([...nonmatching, ...matching.slice(0, -1)])).toBe(true);
    expect(shouldLoad([...nonmatching, ...matching])).toBe(false);
    expect(shouldLoad([])).toBe(false);
    expect(shouldLoadMoreArenaCandidates(nonmatching, UserStreamTimeframe.ALL_TIME, now, CONTENT.ALL)).toBe(false);
  });

  it('uses the unfiltered timeline to decide when a bounded content search ends', () => {
    const recentImage = { ...idea('a:image', 1, 0), kind: 'image', indexedAt: now };
    const oldImage = { ...recentImage, id: 'a:old-image', indexedAt: now - 8 * day };
    const shouldLoad = (candidates: ArenaIdea[]) =>
      shouldLoadMoreArenaCandidates(candidates, UserStreamTimeframe.THIS_WEEK, now, CONTENT.SHORT);
    expect(shouldLoad([recentImage])).toBe(true);
    expect(shouldLoad([...entries, recentImage])).toBe(true);
    expect(shouldLoad([...entries, oldImage])).toBe(false);
  });
});

describe('Arena post timeframe', () => {
  const now = Date.UTC(2026, 8, 4, 12);
  const day = 24 * 60 * 60 * 1000;

  it.each([
    [UserStreamTimeframe.TODAY, 1],
    [UserStreamTimeframe.THIS_WEEK, 7],
    [UserStreamTimeframe.THIS_MONTH, 30],
  ] as const)('filters %s before ranking and includes its exact lower boundary', (timeframe, days) => {
    const entries = [
      { ...idea('a:old-leader', 99, 0), indexedAt: now - days * day - 1 },
      { ...idea('b:boundary', 10, 1), indexedAt: now - days * day },
      { ...idea('c:now', 5, 2), indexedAt: now },
      { ...idea('e:invalid', 100, 3), indexedAt: Number.NaN },
    ];
    const ranked = rankArenaIdeasForTimeframe(entries, 'tags', timeframe, now);
    expect(ranked.map(({ id, rank }) => ({ id, rank }))).toEqual([
      { id: 'b:boundary', rank: 1 },
      { id: 'c:now', rank: 2 },
    ]);
    expect(entries).toHaveLength(4);
  });

  it('keeps new posts eligible after the window was selected', () => {
    const recent = { ...idea('a:new-arrival', 1, 0), indexedAt: now + 60_000 };
    expect(filterArenaIdeasByTimeframe([recent], UserStreamTimeframe.TODAY, now)).toEqual([recent]);
  });

  it('keeps all loaded candidates for All time', () => {
    const entries = [idea('a:old', 20, 1), { ...idea('b:new', 10, 2), indexedAt: now }];
    expect(filterArenaIdeasByTimeframe(entries, UserStreamTimeframe.ALL_TIME, now)).toBe(entries);
  });

  it('loads bounded windows chronologically before applying the selected ranking', () => {
    expect(getArenaCandidateSorting('popular', UserStreamTimeframe.THIS_MONTH)).toBe('timeline');
    expect(getArenaCandidateSorting('tags', UserStreamTimeframe.THIS_WEEK)).toBe('timeline');
    expect(getArenaCandidateSorting('newest', UserStreamTimeframe.ALL_TIME)).toBe('timeline');
    expect(getArenaCandidateSorting('popular', UserStreamTimeframe.ALL_TIME)).toBe('total_engagement');
  });

  it('continues a bounded timeline until an out-of-window post is loaded', () => {
    const recent = { ...idea('recent', 1, 0), indexedAt: now - 1_000 };
    const old = { ...idea('old', 1, 0), indexedAt: now - 31 * day };

    expect(shouldLoadMoreArenaTimeframe([recent], UserStreamTimeframe.THIS_MONTH, now)).toBe(true);
    expect(shouldLoadMoreArenaTimeframe([recent, old], UserStreamTimeframe.THIS_MONTH, now)).toBe(false);
    expect(shouldLoadMoreArenaTimeframe([recent], UserStreamTimeframe.ALL_TIME, now)).toBe(false);
  });
});
