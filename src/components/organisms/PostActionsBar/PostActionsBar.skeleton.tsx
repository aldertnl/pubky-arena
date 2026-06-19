import { Container } from '@/atoms/Container/Container';
import { Skeleton } from '@/atoms/Skeleton/Skeleton';
import { cn } from '@/libs/utils/utils';

// Mirrors the real `PostActionsBar`: tag / reply / repost carry a count (wider),
// save + more are icon-only (narrower). Left-aligned `flex flex-wrap gap-2` group.
const TAG_ACTION_BUTTON_WIDTH = 'w-12';
const ACTION_BUTTON_WIDTHS = [TAG_ACTION_BUTTON_WIDTH, 'w-12', 'w-12', 'w-9', 'w-9'];

interface PostActionsBarSkeletonProps {
  className?: string;
  /** When true, only the tag-count pill skeleton is rendered (collections card/hero). */
  tagOnly?: boolean;
}

export function PostActionsBarSkeleton({ className, tagOnly = false }: PostActionsBarSkeletonProps) {
  const widths = tagOnly ? [TAG_ACTION_BUTTON_WIDTH] : ACTION_BUTTON_WIDTHS;

  return (
    <Container overrideDefaults className={cn('flex flex-wrap gap-2', className)}>
      {widths.map((width, i) => (
        <Skeleton key={`post-actions-skeleton-${i}`} className={cn('h-8 rounded-full', width)} />
      ))}
    </Container>
  );
}
