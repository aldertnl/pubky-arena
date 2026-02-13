import * as Core from '@/core';
import { TIMELINE_ITEM_TYPE } from './timelineItem.constants';
import type { TimelineItem } from './timelineItem.types';

/**
 * Builds timeline items from postIds and plainRepostOriginals map.
 * Groups plain reposts of the same original post into RepostGroup items.
 * Requires 2+ unique reposters to form a group; single reposts stay as SinglePostItem.
 */
export function buildTimelineItems(
  postIds: string[],
  plainRepostOriginals: Map<string, Core.PlainRepostInfo>,
  currentUserPubky: Core.Pubky | null,
): TimelineItem[] {
  if (postIds.length === 0) return [];

  // First pass: collect repost groups by original post ID
  const groupsByOriginal = new Map<string, { repostIds: string[]; timestamps: number[] }>();

  for (const postId of postIds) {
    const repostInfo = plainRepostOriginals.get(postId);
    if (!repostInfo) continue;

    const existing = groupsByOriginal.get(repostInfo.originalPostId);
    if (existing) {
      existing.repostIds.push(postId);
      existing.timestamps.push(repostInfo.indexedAt);
    } else {
      groupsByOriginal.set(repostInfo.originalPostId, {
        repostIds: [postId],
        timestamps: [repostInfo.indexedAt],
      });
    }
  }

  // Second pass: build timeline items in order
  const result: TimelineItem[] = [];
  const processedOriginals = new Set<string>();

  for (const postId of postIds) {
    const repostInfo = plainRepostOriginals.get(postId);

    if (!repostInfo) {
      // Regular post (not a plain repost)
      result.push({ type: TIMELINE_ITEM_TYPE.SINGLE, postId });
      continue;
    }

    const { originalPostId } = repostInfo;

    // Skip if we already processed this original's group
    if (processedOriginals.has(originalPostId)) continue;
    processedOriginals.add(originalPostId);

    const group = groupsByOriginal.get(originalPostId)!;

    // Extract unique reposters from composite IDs
    const reposterMap = new Map<Core.Pubky, string>(); // pubky -> first repostId
    for (const repostId of group.repostIds) {
      try {
        const { pubky } = Core.parseCompositeId(repostId);
        if (!reposterMap.has(pubky)) {
          reposterMap.set(pubky, repostId);
        }
      } catch {
        // Skip invalid composite IDs
      }
    }

    // Need 2+ unique reposters to form a group
    if (reposterMap.size < 2) {
      result.push({ type: TIMELINE_ITEM_TYPE.SINGLE, postId: group.repostIds[0] });
      continue;
    }

    // Build RepostGroup with current user first if included
    const reposterIds: Core.Pubky[] = [];
    const repostPostIds: string[] = [];
    let currentUserRepostId: string | undefined;
    let includesCurrentUser = false;

    if (currentUserPubky && reposterMap.has(currentUserPubky)) {
      includesCurrentUser = true;
      currentUserRepostId = reposterMap.get(currentUserPubky);
      reposterIds.push(currentUserPubky);
      repostPostIds.push(currentUserRepostId!);
    }

    for (const [pubky, repostId] of reposterMap) {
      if (pubky !== currentUserPubky) {
        reposterIds.push(pubky);
        repostPostIds.push(repostId);
      }
    }

    result.push({
      type: TIMELINE_ITEM_TYPE.REPOST_GROUP,
      originalPostId,
      repostPostIds,
      reposterIds,
      earliestTimestamp: Math.min(...group.timestamps),
      includesCurrentUser,
      currentUserRepostId,
    });
  }

  return result;
}
