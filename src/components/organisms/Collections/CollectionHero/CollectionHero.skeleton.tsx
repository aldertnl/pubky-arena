import { Card, CardContent } from '@/atoms/Card/Card';
import { Container } from '@/atoms/Container/Container';
import { Skeleton } from '@/atoms/Skeleton/Skeleton';
import { cn } from '@/libs/utils/utils';

interface CollectionHeroSkeletonProps {
  className?: string;
}

/** Matches `PostActionsBarSkeleton` tag-with-count pill (`w-12`). */
const TAG_COUNT_BUTTON_CLASS = 'h-8 w-12 shrink-0 rounded-full';
/** Matches `Button` `size="sm"` icon-only with `px-3.5`. */
const ICON_ACTION_BUTTON_CLASS = 'h-8 w-11 shrink-0 rounded-full';

/**
 * Skeleton loading state for `CollectionHero`.
 *
 * Mirrors the real hero's outer shape (tall rounded banner, generous padding,
 * vertically stacked title → owner → description → tags → actions) so the hero
 * never flashes a half-empty state while `usePostDetails` resolves.
 */
export function CollectionHeroSkeleton({ className }: CollectionHeroSkeletonProps) {
  return (
    <Card
      data-testid="collection-hero-skeleton"
      className={cn('relative gap-0 overflow-hidden rounded-md py-0', className)}
    >
      <CardContent className="flex flex-col justify-center gap-4 p-8 lg:p-12">
        {/* Title — text-5xl lg:text-6xl */}
        <Skeleton className="h-12 w-80 max-w-full rounded-md lg:h-16" />

        {/* Owner + item count */}
        <Container overrideDefaults className="flex w-full items-center gap-6">
          <Container overrideDefaults className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </Container>
          <Container overrideDefaults className="flex shrink-0 items-center gap-1">
            <Skeleton className="size-3 shrink-0 rounded-sm" />
            <Skeleton className="h-4 w-5 shrink-0 rounded-sm" />
          </Container>
        </Container>

        {/* Description (2 lines — text-xl lg:text-2xl, leading-8) */}
        <Container overrideDefaults className="flex w-full max-w-3xl flex-col gap-2">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-2/3 rounded-md" />
        </Container>

        {/* Tags row — tags (left) | tag toggle (right), same as hero */}
        <Container
          overrideDefaults
          className="flex w-full flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4"
        >
          <Container overrideDefaults className="flex min-w-0 flex-1 flex-wrap items-start gap-2">
            <Skeleton className="h-8 w-[4.5rem] shrink-0 rounded-md" />
            <Skeleton className="h-8 w-20 shrink-0 rounded-md" />
            <Skeleton className="size-8 shrink-0 rounded-md" />
          </Container>
          <Skeleton className={TAG_COUNT_BUTTON_CLASS} />
        </Container>

        {/* Actions — Share / Edit / Delete (`size="sm"`, labels on lg+) */}
        <Container overrideDefaults className="flex flex-wrap items-center gap-3">
          <Skeleton className={cn(ICON_ACTION_BUTTON_CLASS, 'lg:w-24')} />
          <Skeleton className={cn(ICON_ACTION_BUTTON_CLASS, 'lg:w-20')} />
          <Skeleton className={cn(ICON_ACTION_BUTTON_CLASS, 'lg:w-24')} />
        </Container>
      </CardContent>
    </Card>
  );
}
