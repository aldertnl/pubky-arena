import type { Pubky } from '../../models.types';

export const TIMELINE_ITEM_TYPE = {
  SINGLE: 'single',
  REPOST_GROUP: 'repost-group',
} as const;

export type SinglePostItem = {
  type: typeof TIMELINE_ITEM_TYPE.SINGLE;
  postId: string;
};

export type RepostGroupItem = {
  type: typeof TIMELINE_ITEM_TYPE.REPOST_GROUP;
  originalPostId: string;
  /** Preserved repost composite IDs for delete/mute/unread operations */
  repostPostIds: string[];
  reposterPubkys: Pubky[];
  earliestTimestamp: number;
};

export type TimelineItem = SinglePostItem | RepostGroupItem;

type PlainRepostOriginal = {
  originalPostId: string;
  indexedAt: number;
};

export type PlainRepostOriginals = Map<string, PlainRepostOriginal>;
