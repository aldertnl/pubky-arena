'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Badge } from '@/atoms/Badge/Badge';
import { Button } from '@/atoms/Button/Button';
import { Card } from '@/atoms/Card/Card';
import { Skeleton } from '@/atoms/Skeleton/Skeleton';
import { Typography } from '@/atoms/Typography/Typography';
import { useBulkUserAvatars } from '@/hooks/useBulkUserAvatars/useBulkUserAvatars';
import { useRelativeTime } from '@/hooks/useRelativeTime/useRelativeTime';
import {
  type ArenaMetric,
  getArenaPopularityScore,
  getArenaVisibleIdeas,
  type RankedArenaIdea,
} from '@/libs/arena/arena';
import { cn, generateRandomColor } from '@/libs/utils/utils';
import { PostHeaderTimestamp } from '@/molecules/PostHeaderTimestamp/PostHeaderTimestamp';
import {
  AVATAR_SIZE_BY_HEADER_SIZE,
  GAP_CLASS_BY_HEADER_SIZE,
  USERNAME_CLASS_BY_HEADER_SIZE,
} from '@/molecules/PostHeaderUserInfo/PostHeaderUserInfo.utils';
import { POST_BODY_TYPOGRAPHY_CLASS } from '@/molecules/PostText/PostText.constants';
import { AvatarWithFallback } from '@/organisms/AvatarWithFallback/AvatarWithFallback';
import styles from './Arena.module.css';
import { ArenaStat } from './ArenaStats';

const ARENA_GRID_IDEAS = 9;

// The leader stays centered; the outer posts run clockwise from the top.
const POST_PLACEMENTS = [
  { x: 50, y: 50, rotation: 0 },
  { x: 48, y: 12, rotation: -3 },
  { x: 73, y: 22, rotation: 2.4 },
  { x: 84, y: 44, rotation: -2 },
  { x: 79, y: 68, rotation: 3 },
  { x: 62, y: 86, rotation: -1.6 },
  { x: 39, y: 84, rotation: 2 },
  { x: 21, y: 69, rotation: -2.5 },
  { x: 21, y: 47, rotation: 1.8 },
  { x: 29, y: 23, rotation: -2.2 },
] as const;

export function ArenaFloorSkeleton({ isList = false }: { isList?: boolean }) {
  return (
    <ol className={cn(styles.floor, styles.skeletonFloor, isList && styles.list)} aria-hidden="true">
      {POST_PLACEMENTS.map((placement, index) => (
        <li
          key={`${placement.x}:${placement.y}`}
          className={styles.contender}
          data-position={index}
          style={
            isList
              ? undefined
              : { left: `${placement.x}%`, top: `${placement.y}%`, zIndex: POST_PLACEMENTS.length - index }
          }
        >
          <Card
            style={
              {
                '--arena-post-scale': Math.max(0.55, (20 - index) / 20),
                '--arena-post-rotation': `${placement.rotation}deg`,
              } as CSSProperties
            }
            className={cn('min-w-0 gap-0 rounded-md py-0 shadow-2xl shadow-black/40', styles.ideaCard)}
          >
            <div className={styles.skeletonCard}>
              <span className={cn(styles.rank, styles.skeletonRank)}>
                <Skeleton className="h-5 w-10 rounded-full" />
              </span>
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-7" />
                    <Skeleton className="h-3 w-6" />
                    <Skeleton className="h-3 w-7" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className={cn('h-4', index % 3 === 0 ? 'w-3/5' : index % 3 === 1 ? 'w-4/5' : 'w-2/3')} />
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ol>
  );
}

export function ArenaFloor({
  ideas,
  selectedId,
  onSelect,
  isList,
  metric,
  topic = '',
  contentLabel = 'Content',
  rotationKey = '',
}: {
  ideas: RankedArenaIdea[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isList: boolean;
  metric: ArenaMetric;
  topic?: string;
  contentLabel?: string;
  rotationKey?: string;
}) {
  const [rotationOffsets, setRotationOffsets] = useState<number[]>([]);
  useEffect(() => {
    // Randomize only after hydration and a filter change, never on card selection
    // or live count updates.
    const frame = requestAnimationFrame(() => {
      setRotationOffsets(POST_PLACEMENTS.map(() => (Math.random() - 0.5) * 3));
    });
    return () => cancelAnimationFrame(frame);
  }, [rotationKey, metric, isList]);

  const visible = isList ? ideas.slice(0, ARENA_GRID_IDEAS) : getArenaVisibleIdeas(ideas, selectedId);
  const shouldReduceMotion = useReducedMotion();
  const { formatRelativeTime } = useRelativeTime();
  const { usersMap } = useBulkUserAvatars(visible.map((idea) => idea.author));
  const topicColor = generateRandomColor(topic);
  return (
    <ol
      className={cn(styles.floor, isList && styles.list)}
      style={{ '--arena-topic-color': topicColor } as CSSProperties}
      aria-label="Idea standings"
    >
      {visible.map((idea, index) => {
        const user = usersMap.get(idea.author);
        const name = user?.name || `${idea.author.slice(0, 6)}…`;
        const leading = metric !== 'newest' && idea.rank === 1 && idea.score > 0;
        const popularityScore = getArenaPopularityScore(idea);
        const showAllStats = metric !== 'newest';
        const indexedAt = Number.isFinite(idea.indexedAt) ? new Date(idea.indexedAt) : null;
        const placement = POST_PLACEMENTS[index] ?? POST_PLACEMENTS[0];
        return (
          <motion.li
            key={idea.id}
            className={styles.contender}
            data-position={index}
            // Rank layers remain inside the floor's isolated stacking context.
            style={
              isList ? undefined : { left: `${placement.x}%`, top: `${placement.y}%`, zIndex: visible.length - index }
            }
            layout={shouldReduceMotion ? false : 'position'}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              layout: { type: 'spring', stiffness: 360, damping: 36, mass: 0.75 },
              opacity: {
                duration: shouldReduceMotion ? 0 : 0.24,
                delay: shouldReduceMotion ? 0 : Math.min(index, 5) * 0.035,
              },
            }}
          >
            <Card
              style={
                {
                  '--arena-post-scale': Math.max(0.55, (21 - idea.rank) / 20),
                  '--arena-post-rotation': `${placement.rotation + (rotationOffsets[index] ?? 0)}deg`,
                } as CSSProperties
              }
              className={cn(
                'min-w-0 gap-0 rounded-md py-0 shadow-2xl shadow-black/60',
                styles.ideaCard,
                leading && styles.leader,
                selectedId === idea.id && styles.selected,
              )}
            >
              <Button
                overrideDefaults
                type="button"
                className={styles.idea}
                onClick={() => onSelect(idea.id)}
                aria-pressed={selectedId === idea.id}
                aria-label={`${metric === 'newest' ? 'Position' : 'Rank'} ${idea.rank}, ${name}: ${idea.preview}. ${idea.tags} tags, ${idea.replies} replies${showAllStats ? `, ${idea.reposts} reposts, ${popularityScore} popularity points` : ''}`}
              >
                <span className={cn(styles.ideaHeader, GAP_CLASS_BY_HEADER_SIZE.normal)}>
                  <AvatarWithFallback
                    name={name}
                    fallbackSeed={idea.author}
                    avatarUrl={user?.avatarUrl}
                    size={AVATAR_SIZE_BY_HEADER_SIZE.normal}
                  />
                  <div className="min-w-0 flex-1">
                    <Typography
                      as="span"
                      overrideDefaults
                      className={cn('block truncate font-bold text-foreground', USERNAME_CLASS_BY_HEADER_SIZE.normal)}
                    >
                      {name}
                    </Typography>
                    <span className={styles.stats}>
                      {metric === 'newest' && indexedAt && (
                        <PostHeaderTimestamp timeAgo={formatRelativeTime(indexedAt)} indexedAt={indexedAt} />
                      )}
                      {showAllStats && (
                        <ArenaStat kind="popular" count={popularityScore} active={metric === 'popular'} />
                      )}
                      <ArenaStat kind="tags" count={idea.tags} active={metric === 'tags'} />
                      <ArenaStat kind="replies" count={idea.replies} active={metric === 'replies'} />
                      {showAllStats && <ArenaStat kind="reposts" count={idea.reposts} active={metric === 'reposts'} />}
                    </span>
                  </div>
                  {leading ? (
                    <>
                      <Badge
                        variant="outline"
                        className={cn(styles.rankPill, styles.rank, styles.leadingRank, 'uppercase')}
                        aria-live="polite"
                      >
                        #{idea.rank} {topic} {contentLabel}
                      </Badge>
                      <span className={cn(styles.awardIcon, styles.postAward)} aria-hidden="true">
                        <Trophy className="size-4" />
                      </span>
                    </>
                  ) : (
                    <Badge variant="outline" className={cn(styles.rankPill, styles.rank)}>
                      #{idea.rank}
                    </Badge>
                  )}
                </span>
                <Typography
                  as="span"
                  overrideDefaults
                  className={cn(POST_BODY_TYPOGRAPHY_CLASS, 'text-secondary-foreground', styles.preview)}
                >
                  {idea.preview}
                </Typography>
                {idea.replyTo && <span className={styles.role}>Reply</span>}
              </Button>
            </Card>
          </motion.li>
        );
      })}
    </ol>
  );
}
