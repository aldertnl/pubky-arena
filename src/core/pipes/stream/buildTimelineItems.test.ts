import { describe, it, expect } from 'vitest';
import { buildTimelineItems } from './buildTimelineItems';
import { TIMELINE_ITEM_TYPE } from '@/core/models';
import type { PlainRepostOriginals } from '@/core/models';

describe('buildTimelineItems', () => {
  const EMPTY_MAP: PlainRepostOriginals = new Map();

  it('returns empty array for empty postIds', () => {
    expect(buildTimelineItems([], EMPTY_MAP)).toEqual([]);
  });

  it('wraps all posts as SinglePostItem when no reposts', () => {
    const postIds = ['alice:post1', 'bob:post2'];
    const items = buildTimelineItems(postIds, EMPTY_MAP);

    expect(items).toEqual([
      { type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'alice:post1' },
      { type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'bob:post2' },
    ]);
  });

  it('groups plain reposts of the same original into a RepostGroupItem', () => {
    const postIds = ['miguel:repost200', 'vlada:repost300', 'matt:post400'];
    const plainRepostOriginals: PlainRepostOriginals = new Map([
      ['miguel:repost200', { originalPostId: 'orlando:post50', indexedAt: 1707000200 }],
      ['vlada:repost300', { originalPostId: 'orlando:post50', indexedAt: 1707000300 }],
    ]);

    const items = buildTimelineItems(postIds, plainRepostOriginals);

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      type: TIMELINE_ITEM_TYPE.REPOST_GROUP,
      originalPostId: 'orlando:post50',
      repostPostIds: ['miguel:repost200', 'vlada:repost300'],
      reposterPubkys: ['miguel', 'vlada'],
      earliestTimestamp: 1707000200,
    });
    expect(items[1]).toEqual({ type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'matt:post400' });
  });

  it('places group at position of first repost, even when reposts are non-consecutive', () => {
    const postIds = ['oier:post100', 'miguel:repost200', 'matt:post400', 'joan:repost500'];
    const plainRepostOriginals: PlainRepostOriginals = new Map([
      ['miguel:repost200', { originalPostId: 'orlando:post50', indexedAt: 1707000200 }],
      ['joan:repost500', { originalPostId: 'orlando:post50', indexedAt: 1707000500 }],
    ]);

    const items = buildTimelineItems(postIds, plainRepostOriginals);

    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({ type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'oier:post100' });
    expect(items[1].type).toBe(TIMELINE_ITEM_TYPE.REPOST_GROUP);
    expect(items[2]).toEqual({ type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'matt:post400' });
  });

  it('handles single plain repost as a group of one', () => {
    const postIds = ['miguel:repost200'];
    const plainRepostOriginals: PlainRepostOriginals = new Map([
      ['miguel:repost200', { originalPostId: 'orlando:post50', indexedAt: 1707000200 }],
    ]);

    const items = buildTimelineItems(postIds, plainRepostOriginals);

    expect(items).toHaveLength(1);
    expect(items[0].type).toBe(TIMELINE_ITEM_TYPE.REPOST_GROUP);
    if (items[0].type === TIMELINE_ITEM_TYPE.REPOST_GROUP) {
      expect(items[0].reposterPubkys).toEqual(['miguel']);
    }
  });

  it('tracks earliest timestamp across grouped reposts', () => {
    const postIds = ['b:repost2', 'a:repost1'];
    const plainRepostOriginals: PlainRepostOriginals = new Map([
      ['b:repost2', { originalPostId: 'orig:post', indexedAt: 5000 }],
      ['a:repost1', { originalPostId: 'orig:post', indexedAt: 1000 }],
    ]);

    const items = buildTimelineItems(postIds, plainRepostOriginals);

    expect(items).toHaveLength(1);
    if (items[0].type === TIMELINE_ITEM_TYPE.REPOST_GROUP) {
      expect(items[0].earliestTimestamp).toBe(1000);
    }
  });

  it('does not include duplicate reposter pubkys', () => {
    const postIds = ['alice:repost1', 'alice:repost2'];
    const plainRepostOriginals: PlainRepostOriginals = new Map([
      ['alice:repost1', { originalPostId: 'orig:post', indexedAt: 1000 }],
      ['alice:repost2', { originalPostId: 'orig:post', indexedAt: 2000 }],
    ]);

    const items = buildTimelineItems(postIds, plainRepostOriginals);

    expect(items).toHaveLength(1);
    if (items[0].type === TIMELINE_ITEM_TYPE.REPOST_GROUP) {
      expect(items[0].reposterPubkys).toEqual(['alice']);
    }
  });

  it('creates separate groups for reposts of different originals', () => {
    const postIds = ['a:repost1', 'b:repost2'];
    const plainRepostOriginals: PlainRepostOriginals = new Map([
      ['a:repost1', { originalPostId: 'orig1:post', indexedAt: 1000 }],
      ['b:repost2', { originalPostId: 'orig2:post', indexedAt: 2000 }],
    ]);

    const items = buildTimelineItems(postIds, plainRepostOriginals);

    expect(items).toHaveLength(2);
    expect(items[0].type).toBe(TIMELINE_ITEM_TYPE.REPOST_GROUP);
    expect(items[1].type).toBe(TIMELINE_ITEM_TYPE.REPOST_GROUP);
    if (items[0].type === TIMELINE_ITEM_TYPE.REPOST_GROUP && items[1].type === TIMELINE_ITEM_TYPE.REPOST_GROUP) {
      expect(items[0].originalPostId).toBe('orig1:post');
      expect(items[1].originalPostId).toBe('orig2:post');
    }
  });

  it('handles malformed composite IDs gracefully (still groups, uses fallback pubky)', () => {
    const postIds = ['MALFORMED', 'alice:repost2'];
    const plainRepostOriginals: PlainRepostOriginals = new Map([
      ['MALFORMED', { originalPostId: 'orig:post', indexedAt: 1000 }],
      ['alice:repost2', { originalPostId: 'orig:post', indexedAt: 2000 }],
    ]);

    const items = buildTimelineItems(postIds, plainRepostOriginals);

    expect(items).toHaveLength(1);
    if (items[0].type === TIMELINE_ITEM_TYPE.REPOST_GROUP) {
      expect(items[0].repostPostIds).toEqual(['MALFORMED', 'alice:repost2']);
      expect(items[0].reposterPubkys).toEqual(['MALFORMED', 'alice']);
    }
  });

  it('full example from plan', () => {
    const postIds = ['oier:post100', 'miguel:repost200', 'vlada:repost300', 'matt:post400', 'joan:repost500'];
    const plainRepostOriginals: PlainRepostOriginals = new Map([
      ['miguel:repost200', { originalPostId: 'orlando:post50', indexedAt: 1707000200 }],
      ['vlada:repost300', { originalPostId: 'orlando:post50', indexedAt: 1707000300 }],
      ['joan:repost500', { originalPostId: 'orlando:post50', indexedAt: 1707000500 }],
    ]);

    const items = buildTimelineItems(postIds, plainRepostOriginals);

    expect(items).toEqual([
      { type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'oier:post100' },
      {
        type: TIMELINE_ITEM_TYPE.REPOST_GROUP,
        originalPostId: 'orlando:post50',
        repostPostIds: ['miguel:repost200', 'vlada:repost300', 'joan:repost500'],
        reposterPubkys: ['miguel', 'vlada', 'joan'],
        earliestTimestamp: 1707000200,
      },
      { type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'matt:post400' },
    ]);
  });
});
