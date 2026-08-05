'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronsRight, Home, Pencil, PlusCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { APP_ROUTES } from '@/app/routes';
import { Button } from '@/atoms/Button/Button';
import { Container } from '@/atoms/Container/Container';
import { DynamicLucideIcon } from '@/atoms/DynamicLucideIcon/DynamicLucideIcon';
import { Heading } from '@/atoms/Heading/Heading';
import { Link } from '@/atoms/Link/Link';
import { Popover, PopoverContent, PopoverTrigger } from '@/atoms/Popover/Popover';
import { Typography } from '@/atoms/Typography/Typography';
import { FeedController } from '@/controllers/feed/feed';
import { useIsMobile } from '@/hooks/useIsMobile/useIsMobile';
import { useRequireAuth } from '@/hooks/useRequireAuth/useRequireAuth';
import { Logger } from '@/libs/logger/logger';
import { handleFeedNavClick } from '@/libs/utils/feedScrollTop';
import { cn } from '@/libs/utils/utils';
import type { FeedModelSchema } from '@/models/feed/feed.schema';
import { CustomFeedDialog } from '../CustomFeedDialog/CustomFeedDialog';

// Survives remounts within the session so navigating between /home and
// /feed/[id] does not flash empty tabs.
let cachedFeeds: FeedModelSchema[] = [];

const MEDIUM_SCREEN_FEED_LIMIT = 4;
const LARGE_SCREEN_FEED_LIMIT = 5;

interface FeedNavigationProps {
  className?: string;
}

interface CustomFeedNavigationItemProps {
  feed: FeedModelSchema;
  isActive: boolean;
  isOverflow?: boolean;
  editLabel: string;
  onNavigate?: () => void;
}

const CustomFeedNavigationItem = ({
  feed,
  isActive,
  isOverflow = false,
  editLabel,
  onNavigate,
}: CustomFeedNavigationItemProps) => {
  const href = `${APP_ROUTES.FEED}/${feed.id}`;

  return (
    <Container
      overrideDefaults
      className={cn(
        'group relative flex w-full min-w-0',
        isOverflow
          ? cn('shrink-0 items-center gap-x-2 px-4 hover:bg-accent', isActive ? 'text-white' : 'text-muted-foreground')
          : cn(
              'items-center gap-x-2 border-b lg:flex-1 lg:justify-center',
              isActive ? 'border-white text-white' : 'border-border text-muted-foreground',
            ),
      )}
      data-testid={isOverflow ? 'overflow-feed-item' : 'custom-feed-tab'}
    >
      <Link
        overrideDefaults
        href={href}
        aria-current={isActive ? 'page' : undefined}
        onClick={(event) => {
          onNavigate?.();
          handleFeedNavClick(event, {
            isActive,
            smoothScrollWhenActive: false,
          });
        }}
        className={cn(
          'flex min-h-12 max-w-full min-w-0 shrink items-center gap-x-2 transition-colors hover:text-white',
          isOverflow ? 'flex-1' : 'flex-1 lg:flex-none',
          isActive ? 'text-white' : 'text-muted-foreground',
        )}
      >
        <DynamicLucideIcon name={feed.icon} className={isOverflow ? 'size-4 shrink-0' : 'size-5 shrink-0'} />

        <Typography overrideDefaults className="truncate font-medium lg:text-sm">
          {feed.name}
        </Typography>
      </Link>

      <CustomFeedDialog mode="edit" feed={feed}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={editLabel}
          className={cn(
            'relative z-10 size-8 shrink-0 rounded-none bg-transparent opacity-100 shadow-none transition-opacity duration-200 ease-out hover:bg-transparent focus-visible:opacity-100',
            !isOverflow && 'lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100',
          )}
          data-testid={`edit-feed-${feed.id}`}
        >
          <Pencil className="size-2.5" />
        </Button>
      </CustomFeedDialog>
    </Container>
  );
};

export const FeedNavigation = ({ className }: FeedNavigationProps) => {
  const pathname = usePathname();
  const tHeader = useTranslations('header');
  const tDialog = useTranslations('dialogs.customFeed');
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const isBelowDesktop = useIsMobile({ breakpoint: 'lg' });
  const isMediumScreen = useIsMobile({ breakpoint: 'xl' });
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const customFeeds = useLiveQuery(
    async () => {
      try {
        if (!isAuthenticated) {
          cachedFeeds = [];
          return [] as FeedModelSchema[];
        }
        const result = await FeedController.getList();
        cachedFeeds = result;
        return result;
      } catch (error) {
        Logger.error('[FeedNavigation] Failed to query custom feeds', {
          error,
        });
        return [] as FeedModelSchema[];
      }
    },
    [isAuthenticated],
    isAuthenticated ? cachedFeeds : [],
  );
  const visibleCustomFeedLimit = isBelowDesktop
    ? customFeeds.length
    : (isMediumScreen ? MEDIUM_SCREEN_FEED_LIMIT : LARGE_SCREEN_FEED_LIMIT) - 1;
  const initiallyVisibleCustomFeeds = customFeeds.slice(0, visibleCustomFeedLimit);
  const activeOverflowFeed = customFeeds
    .slice(visibleCustomFeedLimit)
    .find((feed) => pathname === `${APP_ROUTES.FEED}/${feed.id}`);
  const visibleCustomFeeds = activeOverflowFeed
    ? [...initiallyVisibleCustomFeeds.slice(0, -1), activeOverflowFeed]
    : initiallyVisibleCustomFeeds;
  const visibleCustomFeedIds = new Set(visibleCustomFeeds.map((feed) => feed.id));
  const overflowFeeds = customFeeds.filter((feed) => !visibleCustomFeedIds.has(feed.id));
  const actionButtonClassName =
    'flex min-h-12 w-full shrink-0 cursor-pointer items-center gap-x-2 border-b border-border text-muted-foreground transition-colors hover:text-white lg:w-9 lg:justify-center';

  return (
    <Container className={cn('overflow-hidden lg:flex-row', className)}>
      <Heading level={2} size="lg" className="mb-2 font-light text-muted-foreground lg:hidden">
        {tHeader('feed')}
      </Heading>

      <Container
        overrideDefaults
        className="flex min-w-0 flex-1 flex-col overflow-hidden lg:flex-row"
        data-testid="feed-navigation-tabs"
      >
        <Link
          overrideDefaults
          href={APP_ROUTES.HOME}
          aria-current={pathname === APP_ROUTES.HOME ? 'page' : undefined}
          onClick={(event) =>
            handleFeedNavClick(event, {
              isActive: pathname === APP_ROUTES.HOME,
              smoothScrollWhenActive: true,
            })
          }
          className={cn(
            'flex min-h-12 w-full min-w-0 items-center gap-x-2 border-b transition-colors hover:text-white lg:flex-1 lg:justify-center',
            pathname === APP_ROUTES.HOME ? 'border-white text-white' : 'border-border text-muted-foreground',
          )}
        >
          <Home className="size-5 shrink-0" />

          <Typography overrideDefaults className="font-medium lg:text-sm">
            {tHeader('home')}
          </Typography>
        </Link>

        {visibleCustomFeeds.map((feed) => (
          <CustomFeedNavigationItem
            key={feed.id}
            feed={feed}
            isActive={pathname === `${APP_ROUTES.FEED}/${feed.id}`}
            editLabel={tDialog('editFeedLabel', { name: feed.name })}
          />
        ))}
      </Container>

      {overflowFeeds.length > 0 && (
        <Popover open={isOverflowOpen} onOpenChange={setIsOverflowOpen}>
          <PopoverTrigger asChild>
            <Button
              overrideDefaults
              type="button"
              aria-label={tDialog('moreFeeds')}
              className={actionButtonClassName}
              data-testid="feed-navigation-overflow-trigger"
            >
              <ChevronsRight className="size-5 shrink-0" />

              <Typography overrideDefaults className="font-medium lg:sr-only">
                {tDialog('moreFeeds')}
              </Typography>
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            sideOffset={8}
            className="max-h-[min(24rem,var(--radix-popover-content-available-height))] w-42 overflow-y-auto p-0"
          >
            <Container overrideDefaults className="flex flex-col" data-testid="feed-navigation-overflow-list">
              {overflowFeeds.map((feed) => (
                <CustomFeedNavigationItem
                  key={feed.id}
                  feed={feed}
                  isActive={pathname === `${APP_ROUTES.FEED}/${feed.id}`}
                  isOverflow
                  editLabel={tDialog('editFeedLabel', { name: feed.name })}
                  onNavigate={() => setIsOverflowOpen(false)}
                />
              ))}
            </Container>
          </PopoverContent>
        </Popover>
      )}

      {isAuthenticated ? (
        <CustomFeedDialog mode="create">
          <Button overrideDefaults className={actionButtonClassName}>
            <PlusCircle className="size-5 shrink-0" />

            <Typography overrideDefaults className="font-medium lg:sr-only">
              {tDialog('createTitle')}
            </Typography>
          </Button>
        </CustomFeedDialog>
      ) : (
        <Button overrideDefaults className={actionButtonClassName} onClick={() => requireAuth(() => undefined)}>
          <PlusCircle className="size-5 shrink-0" />

          <Typography overrideDefaults className="font-medium lg:sr-only">
            {tDialog('createTitle')}
          </Typography>
        </Button>
      )}
    </Container>
  );
};
