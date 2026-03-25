import type { PlainRepostOriginals, TimelineItem, SinglePostItem, RepostGroupItem, Pubky } from '@/core/models';
import { TIMELINE_ITEM_TYPE } from '@/core/models';
import { parseCompositeId } from '@/core/models/models.utils';

/**
 * Pure pipe that transforms a flat list of postIds + plain repost metadata
 * into an ordered list of TimelineItem[].
 *
 * Groups consecutive and non-consecutive plain reposts of the same original
 * post into a single RepostGroupItem. The group is placed at the position
 * of the first (most recent) repost in the original postIds array.
 *
 * Non-repost posts and quote reposts remain as SinglePostItem.
 */
export function buildTimelineItems(postIds: string[], plainRepostOriginals: PlainRepostOriginals): TimelineItem[] {
  if (postIds.length === 0) return [];

  const groupsByOriginal = new Map<
    string,
    { repostPostIds: string[]; reposterPubkys: Pubky[]; earliestTimestamp: number }
  >();

  const firstIndexByOriginal = new Map<string, number>();

  for (let i = 0; i < postIds.length; i++) {
    const repostInfo = plainRepostOriginals.get(postIds[i]);
    if (!repostInfo) continue;

    const { originalPostId, indexedAt } = repostInfo;

    let group = groupsByOriginal.get(originalPostId);
    if (!group) {
      group = { repostPostIds: [], reposterPubkys: [], earliestTimestamp: indexedAt };
      groupsByOriginal.set(originalPostId, group);
      firstIndexByOriginal.set(originalPostId, i);
    }

    group.repostPostIds.push(postIds[i]);

    try {
      const { pubky } = parseCompositeId(postIds[i]);
      if (!group.reposterPubkys.includes(pubky)) {
        group.reposterPubkys.push(pubky);
      }
    } catch {
      const rawId = postIds[i].split(':')[0] as Pubky;
      if (rawId && !group.reposterPubkys.includes(rawId)) {
        group.reposterPubkys.push(rawId);
      }
    }

    if (indexedAt < group.earliestTimestamp) {
      group.earliestTimestamp = indexedAt;
    }
  }

  const items: TimelineItem[] = [];

  for (let i = 0; i < postIds.length; i++) {
    const repostInfo = plainRepostOriginals.get(postIds[i]);

    if (!repostInfo) {
      const singleItem: SinglePostItem = {
        type: TIMELINE_ITEM_TYPE.SINGLE,
        postId: postIds[i],
      };
      items.push(singleItem);
      continue;
    }

    if (firstIndexByOriginal.get(repostInfo.originalPostId) !== i) continue;

    const group = groupsByOriginal.get(repostInfo.originalPostId);
    if (!group) continue;

    const repostGroupItem: RepostGroupItem = {
      type: TIMELINE_ITEM_TYPE.REPOST_GROUP,
      originalPostId: repostInfo.originalPostId,
      repostPostIds: group.repostPostIds,
      reposterPubkys: group.reposterPubkys,
      earliestTimestamp: group.earliestTimestamp,
    };
    items.push(repostGroupItem);
  }

  return items;
}
