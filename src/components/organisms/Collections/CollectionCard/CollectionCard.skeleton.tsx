import { Card, CardContent } from '@/atoms/Card/Card';
import { Container } from '@/atoms/Container/Container';
import { Skeleton } from '@/atoms/Skeleton/Skeleton';
import { cn } from '@/libs/utils/utils';

interface CollectionCardSkeletonProps {
  className?: string;
}

/** Matches `PostActionsBarSkeleton` tag-with-count pill (`w-12`). */
const TAG_COUNT_BUTTON_CLASS = 'h-8 w-12 shrink-0 rounded-full';
/** Matches `Button` `size="sm"` icon-only with `px-3.5` (icon 16px + 28px padding ≈ 44px / `w-11`). */
const ICON_ACTION_BUTTON_CLASS = 'h-8 w-11 shrink-0 rounded-full';

/**
 * Skeleton loading state for `CollectionCard`.
 *
 * Mirrors the real card's responsive layout:
 *   - mobile: hug content (no description slot, no stretch)
 *   - lg+: one-line description slot + tags row pinned to the bottom for equal
 *     height in the two-column grid (matches `CollectionCard` desktop behavior)
 */
export function CollectionCardSkeleton({ className }: CollectionCardSkeletonProps) {
  return (
    <Container
      overrideDefaults
      data-testid="collection-card-skeleton"
      className={cn('relative block h-auto w-full lg:h-full lg:max-w-187', className)}
    >
      <Card className="relative isolate h-auto gap-0 overflow-hidden rounded-md py-0 lg:h-full">
        <CardContent className="flex h-auto flex-col gap-3 p-6 lg:h-full">
          {/* Header row: icon + title (left) | count + avatar (right) */}
          <Container overrideDefaults className="flex w-full flex-wrap items-center gap-2 lg:flex-nowrap">
            <Container overrideDefaults className="flex min-w-0 flex-1 items-center gap-2">
              <Skeleton className="size-6 shrink-0 rounded-sm" />
              <Skeleton className="h-7 w-48 max-w-full rounded-md" />
            </Container>
            <Container overrideDefaults className="flex shrink-0 items-center justify-end gap-2 lg:gap-3">
              <Container overrideDefaults className="hidden items-center gap-1 lg:flex">
                <Skeleton className="size-3 shrink-0 rounded-sm" />
                <Skeleton className="h-4 w-5 shrink-0 rounded-sm" />
              </Container>
              <Skeleton className="size-6 shrink-0 rounded-full" />
            </Container>
          </Container>

          {/* Description — hug on mobile; reserved one-line slot on lg (empty or filled cards). */}
          <Skeleton className="hidden h-6 w-full rounded-md lg:block" />

          {/* Bottom row: tags (left) | tag toggle + action (right) — pinned on lg. */}
          <Container
            overrideDefaults
            className="flex w-full items-start gap-3 lg:mt-auto lg:min-h-8 lg:flex-wrap lg:gap-2"
          >
            <Container overrideDefaults className="min-w-0 flex-1">
              <Container overrideDefaults className="flex flex-wrap items-start gap-2">
                <Skeleton className="h-8 w-[4.5rem] shrink-0 rounded-md" />
                <Skeleton className="h-8 w-20 shrink-0 rounded-md" />
                <Skeleton className="size-8 shrink-0 rounded-md" />
              </Container>
            </Container>
            <Container overrideDefaults className="flex shrink-0 items-center gap-2">
              <Skeleton className={TAG_COUNT_BUTTON_CLASS} />
              <Skeleton className={ICON_ACTION_BUTTON_CLASS} />
            </Container>
          </Container>
        </CardContent>
      </Card>
    </Container>
  );
}
