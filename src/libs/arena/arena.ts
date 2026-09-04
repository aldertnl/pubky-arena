import type { Pubky } from '@/models/models.types';
import { UserStreamTimeframe } from '@/services/nexus/nexus.types';

export const ARENA_TOPIC_LIMIT = 10;
export const ARENA_PAGE_SIZE = 24;
export const ARENA_VISIBLE_IDEAS = 10;
export type ArenaMetric = 'popular' | 'tags' | 'replies' | 'reposts' | 'newest';

export interface ArenaIdea {
  id: string;
  author: Pubky;
  preview: string;
  kind: string;
  indexedAt: number;
  tags: number;
  replies: number;
  reposts: number;
  replyTo: string | null;
}

/** Uses the same indexed timestamp displayed by native Pubky post cards. */
export function filterArenaIdeasByTimeframe(ideas: ArenaIdea[], timeframe: UserStreamTimeframe, now: number) {
  if (timeframe === UserStreamTimeframe.ALL_TIME) return ideas;
  const days = {
    [UserStreamTimeframe.TODAY]: 1,
    [UserStreamTimeframe.THIS_WEEK]: 7,
    [UserStreamTimeframe.THIS_MONTH]: 30,
  }[timeframe];
  const since = now - days * 24 * 60 * 60 * 1000;
  // New posts may arrive after the window was selected; keep them eligible.
  return ideas.filter((idea) => Number.isFinite(idea.indexedAt) && idea.indexedAt >= since);
}

export interface RankedArenaIdea extends ArenaIdea {
  rank: number;
  score: number;
}

export function getArenaPopularityScore(idea: Pick<ArenaIdea, 'tags' | 'replies' | 'reposts'>) {
  const contribution = (count: number, weight: number) => (Number.isFinite(count) && count > 0 ? count * weight : 0);
  return contribution(idea.tags, 1) + contribution(idea.replies, 4) + contribution(idea.reposts, 3);
}

function getArenaScore(idea: ArenaIdea, metric: ArenaMetric) {
  if (metric === 'popular') return getArenaPopularityScore(idea);
  const score = metric === 'newest' ? idea.indexedAt : idea[metric];
  return Number.isFinite(score) ? score : 0;
}

/** Sequential standings use a stable ID order to break equal-score ties. */
export function rankArenaIdeas(ideas: ArenaIdea[], metric: ArenaMetric): RankedArenaIdea[] {
  const unique = [...new Map(ideas.map((idea) => [idea.id, idea])).values()];
  const sorted = unique.sort((a, b) => getArenaScore(b, metric) - getArenaScore(a, metric) || a.id.localeCompare(b.id));
  return sorted.map((idea, index) => ({ ...idea, rank: index + 1, score: getArenaScore(idea, metric) }));
}

function metricLabel(metric: Exclude<ArenaMetric, 'newest'>, count: number) {
  if (metric === 'popular') return count === 1 ? 'point' : 'points';
  return count === 1 ? { tags: 'tag', replies: 'reply', reposts: 'repost' }[metric] : metric;
}

export function getArenaLead(ideas: RankedArenaIdea[], metric: ArenaMetric): string {
  if (ideas.length < 2 || metric === 'newest') return '';
  const leader = ideas[0];
  if (leader.score === 0) return '';
  const tied = ideas.filter((idea) => idea.score === leader.score).length;
  if (tied > 1) return 'tied for lead';
  const margin = leader.score - ideas[1].score;
  return `leading by ${margin} ${metricLabel(metric, margin)}`;
}

/** Preserve the leader and selected idea when the floor shows a smaller sample. */
export function getArenaVisibleIdeas(ideas: RankedArenaIdea[], selectedId?: string) {
  const required = new Set([ideas[0]?.id, selectedId].filter(Boolean));
  const visible = ideas.slice(0, ARENA_VISIBLE_IDEAS);
  for (const id of required) {
    if (visible.some((idea) => idea.id === id)) continue;
    const idea = ideas.find((candidate) => candidate.id === id);
    const slot = visible.findLastIndex((candidate) => !required.has(candidate.id));
    if (idea && slot >= 0) visible[slot] = idea;
  }
  return visible;
}
