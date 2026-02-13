import { describe, it, expect } from 'vitest';
import type { PlainRepostInfo } from '@/core';
import { TIMELINE_ITEM_TYPE } from './timelineItem.constants';
import type { SinglePostItem, RepostGroup } from './timelineItem.types';
import { buildTimelineItems } from './Posts.utils';

describe('buildTimelineItems', () => {
  describe('Empty and regular posts', () => {
    it('returns empty array for empty postIds', () => {
      const result = buildTimelineItems([], new Map(), null);
      expect(result).toEqual([]);
    });

    it('returns all SinglePostItems when no plain reposts exist', () => {
      const postIds = ['author1:post1', 'author2:post2', 'author3:post3'];
      const result = buildTimelineItems(postIds, new Map(), null);

      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'author1:post1' },
        { type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'author2:post2' },
        { type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'author3:post3' },
      ]);
    });

    it('returns SinglePostItems for posts not in plainRepostOriginals', () => {
      const postIds = ['author1:post1', 'user1:repost1'];
      const repostOriginals = new Map<string, PlainRepostInfo>([
        ['user1:repost1', { originalPostId: 'original:post1', indexedAt: 1000 }],
      ]);

      const result = buildTimelineItems(postIds, repostOriginals, null);
      // author1:post1 → single, user1:repost1 → single (only 1 unique reposter)
      expect(result[0]).toEqual({ type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'author1:post1' });
    });
  });

  describe('Single reposter (no grouping)', () => {
    it('returns SinglePostItem when only one unique reposter exists', () => {
      const postIds = ['user1:repost1'];
      const repostOriginals = new Map<string, PlainRepostInfo>([
        ['user1:repost1', { originalPostId: 'original:post1', indexedAt: 1000 }],
      ]);

      const result = buildTimelineItems(postIds, repostOriginals, null);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'user1:repost1' });
    });

    it('returns SinglePostItem when same user reposted twice', () => {
      const postIds = ['user1:repost1', 'user1:repost2'];
      const repostOriginals = new Map<string, PlainRepostInfo>([
        ['user1:repost1', { originalPostId: 'original:post1', indexedAt: 1000 }],
        ['user1:repost2', { originalPostId: 'original:post1', indexedAt: 2000 }],
      ]);

      const result = buildTimelineItems(postIds, repostOriginals, null);
      // Only 1 unique reposter (user1), so it falls back to single
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'user1:repost1' });
    });
  });

  describe('Repost grouping (2+ unique reposters)', () => {
    it('creates a RepostGroup when 2 unique reposters exist', () => {
      const postIds = ['user1:repost1', 'user2:repost2'];
      const repostOriginals = new Map<string, PlainRepostInfo>([
        ['user1:repost1', { originalPostId: 'original:post1', indexedAt: 1000 }],
        ['user2:repost2', { originalPostId: 'original:post1', indexedAt: 2000 }],
      ]);

      const result = buildTimelineItems(postIds, repostOriginals, null);
      expect(result).toHaveLength(1);

      const group = result[0] as RepostGroup;
      expect(group.type).toBe(TIMELINE_ITEM_TYPE.REPOST_GROUP);
      expect(group.originalPostId).toBe('original:post1');
      expect(group.reposterIds).toContain('user1');
      expect(group.reposterIds).toContain('user2');
      expect(group.reposterIds).toHaveLength(2);
      expect(group.repostPostIds).toHaveLength(2);
      expect(group.earliestTimestamp).toBe(1000);
      expect(group.includesCurrentUser).toBe(false);
      expect(group.currentUserRepostId).toBeUndefined();
    });

    it('creates a RepostGroup with 3 unique reposters', () => {
      const postIds = ['user1:repost1', 'user2:repost2', 'user3:repost3'];
      const repostOriginals = new Map<string, PlainRepostInfo>([
        ['user1:repost1', { originalPostId: 'original:post1', indexedAt: 3000 }],
        ['user2:repost2', { originalPostId: 'original:post1', indexedAt: 1000 }],
        ['user3:repost3', { originalPostId: 'original:post1', indexedAt: 2000 }],
      ]);

      const result = buildTimelineItems(postIds, repostOriginals, null);
      expect(result).toHaveLength(1);

      const group = result[0] as RepostGroup;
      expect(group.type).toBe(TIMELINE_ITEM_TYPE.REPOST_GROUP);
      expect(group.reposterIds).toHaveLength(3);
      expect(group.earliestTimestamp).toBe(1000);
    });

    it('places current user first in reposterIds when included', () => {
      const postIds = ['user1:repost1', 'currentUser:repost2', 'user3:repost3'];
      const repostOriginals = new Map<string, PlainRepostInfo>([
        ['user1:repost1', { originalPostId: 'original:post1', indexedAt: 1000 }],
        ['currentUser:repost2', { originalPostId: 'original:post1', indexedAt: 2000 }],
        ['user3:repost3', { originalPostId: 'original:post1', indexedAt: 3000 }],
      ]);

      const result = buildTimelineItems(postIds, repostOriginals, 'currentUser');
      const group = result[0] as RepostGroup;

      expect(group.includesCurrentUser).toBe(true);
      expect(group.currentUserRepostId).toBe('currentUser:repost2');
      expect(group.reposterIds[0]).toBe('currentUser');
    });

    it('does not set includesCurrentUser when current user is not in group', () => {
      const postIds = ['user1:repost1', 'user2:repost2'];
      const repostOriginals = new Map<string, PlainRepostInfo>([
        ['user1:repost1', { originalPostId: 'original:post1', indexedAt: 1000 }],
        ['user2:repost2', { originalPostId: 'original:post1', indexedAt: 2000 }],
      ]);

      const result = buildTimelineItems(postIds, repostOriginals, 'currentUser');
      const group = result[0] as RepostGroup;

      expect(group.includesCurrentUser).toBe(false);
      expect(group.currentUserRepostId).toBeUndefined();
    });
  });

  describe('Mixed posts and reposts', () => {
    it('handles mix of regular posts and grouped reposts in order', () => {
      const postIds = ['author1:post1', 'user1:repost1', 'user2:repost2', 'author2:post2'];
      const repostOriginals = new Map<string, PlainRepostInfo>([
        ['user1:repost1', { originalPostId: 'original:post1', indexedAt: 1000 }],
        ['user2:repost2', { originalPostId: 'original:post1', indexedAt: 2000 }],
      ]);

      const result = buildTimelineItems(postIds, repostOriginals, null);
      expect(result).toHaveLength(3);

      // First: regular post
      expect(result[0]).toEqual({ type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'author1:post1' });

      // Second: repost group (placed at position of first repost)
      const group = result[1] as RepostGroup;
      expect(group.type).toBe(TIMELINE_ITEM_TYPE.REPOST_GROUP);
      expect(group.originalPostId).toBe('original:post1');

      // Third: regular post
      expect(result[2]).toEqual({ type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'author2:post2' });
    });

    it('handles multiple different repost groups', () => {
      const postIds = ['user1:repostA1', 'user2:repostA2', 'user3:repostB1', 'user4:repostB2'];
      const repostOriginals = new Map<string, PlainRepostInfo>([
        ['user1:repostA1', { originalPostId: 'original:postA', indexedAt: 1000 }],
        ['user2:repostA2', { originalPostId: 'original:postA', indexedAt: 2000 }],
        ['user3:repostB1', { originalPostId: 'original:postB', indexedAt: 3000 }],
        ['user4:repostB2', { originalPostId: 'original:postB', indexedAt: 4000 }],
      ]);

      const result = buildTimelineItems(postIds, repostOriginals, null);
      expect(result).toHaveLength(2);

      const groupA = result[0] as RepostGroup;
      expect(groupA.originalPostId).toBe('original:postA');
      expect(groupA.earliestTimestamp).toBe(1000);

      const groupB = result[1] as RepostGroup;
      expect(groupB.originalPostId).toBe('original:postB');
      expect(groupB.earliestTimestamp).toBe(3000);
    });

    it('skips subsequent reposts of already-processed group', () => {
      // Reposts are interleaved with regular posts
      const postIds = ['user1:repost1', 'author1:post1', 'user2:repost2'];
      const repostOriginals = new Map<string, PlainRepostInfo>([
        ['user1:repost1', { originalPostId: 'original:post1', indexedAt: 1000 }],
        ['user2:repost2', { originalPostId: 'original:post1', indexedAt: 2000 }],
      ]);

      const result = buildTimelineItems(postIds, repostOriginals, null);
      expect(result).toHaveLength(2);

      // Group placed at position of first repost (user1:repost1)
      const group = result[0] as RepostGroup;
      expect(group.type).toBe(TIMELINE_ITEM_TYPE.REPOST_GROUP);

      // Regular post comes after the group
      expect(result[1]).toEqual({ type: TIMELINE_ITEM_TYPE.SINGLE, postId: 'author1:post1' });

      // user2:repost2 is consumed by the group, not rendered separately
    });
  });

  describe('Edge cases', () => {
    it('handles null currentUserPubky', () => {
      const postIds = ['user1:repost1', 'user2:repost2'];
      const repostOriginals = new Map<string, PlainRepostInfo>([
        ['user1:repost1', { originalPostId: 'original:post1', indexedAt: 1000 }],
        ['user2:repost2', { originalPostId: 'original:post1', indexedAt: 2000 }],
      ]);

      const result = buildTimelineItems(postIds, repostOriginals, null);
      const group = result[0] as RepostGroup;
      expect(group.includesCurrentUser).toBe(false);
    });

    it('handles empty plainRepostOriginals map with posts', () => {
      const postIds = ['author1:post1', 'author2:post2'];
      const result = buildTimelineItems(postIds, new Map(), null);

      expect(result).toHaveLength(2);
      result.forEach((item, i) => {
        expect(item.type).toBe(TIMELINE_ITEM_TYPE.SINGLE);
        expect((item as SinglePostItem).postId).toBe(postIds[i]);
      });
    });
  });
});
