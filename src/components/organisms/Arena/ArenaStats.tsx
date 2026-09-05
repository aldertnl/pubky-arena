import { Flame, MessageCircle, Repeat, StickyNote, Tag, UsersRound } from 'lucide-react';
import { Typography } from '@/atoms/Typography/Typography';
import { cn } from '@/libs/utils/utils';
import { POST_ACTION_COUNT_TYPOGRAPHY_CLASS } from '@/organisms/PostActionsBar/PostActionsBar.constants';
import styles from './Arena.module.css';

const icons = {
  followers: UsersRound,
  posts: StickyNote,
  tags: Tag,
  replies: MessageCircle,
  reposts: Repeat,
  popular: Flame,
};

export function ArenaStat({
  kind,
  count,
  active = false,
}: {
  kind: keyof typeof icons;
  count?: number;
  active?: boolean;
}) {
  const Icon = icons[kind];
  const value = count?.toLocaleString('en-US');
  const label = `${value ?? 'Loading'} ${kind === 'popular' ? 'popularity points' : kind}`;
  return (
    <Typography
      as="span"
      overrideDefaults
      className={cn(
        POST_ACTION_COUNT_TYPOGRAPHY_CLASS,
        'inline-flex items-center gap-0.5 text-[0.625rem] leading-3.5 tracking-normal normal-case tabular-nums',
        active ? 'text-brand' : 'text-muted-foreground',
      )}
      aria-label={label}
      title={kind === 'popular' ? `${label} · Tags + (replies × 4) + (reposts × 3)` : label}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span key={count} className={styles.statValue} aria-hidden="true">
        {value ?? '…'}
      </span>
    </Typography>
  );
}
