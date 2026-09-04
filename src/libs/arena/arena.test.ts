import { describe, expect, it } from 'vitest';
import { UserStreamTimeframe } from '@/services/nexus/nexus.types';
import {
  type ArenaIdea,
  filterArenaIdeasByTimeframe,
  getArenaCandidateSorting,
  getArenaLead,
  getArenaVisibleIdeas,
  rankArenaIdeas,
  rankArenaIdeasForTimeframe,
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

  it('orders Newest by indexed time regardless of engagement, without a competitive lead', () => {
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
