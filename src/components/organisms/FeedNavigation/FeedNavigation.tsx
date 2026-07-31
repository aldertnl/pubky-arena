'use client';

import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
// Module-level cache: survives remounts within the session so that
// navigating between /home and /feed/[id] doesn't flash empty tabs.
import { Home, Pencil, PlusCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { APP_ROUTES } from '@/app/routes';
import { Button } from '@/atoms/Button/Button';
import { Container } from '@/atoms/Container/Container';
import { DynamicLucideIcon } from '@/atoms/DynamicLucideIcon/DynamicLucideIcon';
import { Heading } from '@/atoms/Heading/Heading';
import { Link } from '@/atoms/Link/Link';
import { Typography } from '@/atoms/Typography/Typography';
import { FeedController } from '@/controllers/feed/feed';
import { useRequireAuth } from '@/hooks/useRequireAuth/useRequireAuth';
import { Logger } from '@/libs/logger/logger';
import { handleFeedNavClick } from '@/libs/utils/feedScrollTop';
import { cn } from '@/libs/utils/utils';
import type { FeedModelSchema } from '@/models/feed/feed.schema';
import { CustomFeedDialog } from '../CustomFeedDialog/CustomFeedDialog';

let cachedFeeds: FeedModelSchema[] = [];
interface FeedNavigationProps {
  className?: string;
}
export const FeedNavigation = ({ className }: FeedNavigationProps) => {
  const pathname = usePathname();
  const tHeader = useTranslations('header');
  const tDialog = useTranslations('dialogs.customFeed');
  const { isAuthenticated, requireAuth } = useRequireAuth();
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
  return (
    <Container className={cn('overflow-x-auto lg:flex-row', className)}>
      <Heading level={2} size="lg" className="mb-2 font-light text-muted-foreground lg:hidden">
        {tHeader('feed')}
      </Heading>

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
          'flex min-h-12 w-full min-w-40 items-center gap-x-2 border-b transition-colors hover:text-white lg:justify-center',
          pathname === APP_ROUTES.HOME ? 'border-white text-white' : 'border-border text-muted-foreground',
        )}
      >
        <Home className="size-5 shrink-0" />

        <Typography overrideDefaults className="font-medium lg:text-sm">
          {tHeader('home')}
        </Typography>
      </Link>

      {customFeeds.map((feed) => {
        const href = `${APP_ROUTES.FEED}/${feed.id}`;
        const isActive = pathname === href;

        return (
          <Container
            overrideDefaults
            key={feed.id}
            className={cn('group relative flex w-full min-w-40', isActive ? 'text-white' : 'text-muted-foreground')}
            data-testid="custom-feed-tab"
          >
            <Link
              overrideDefaults
              href={href}
              aria-current={isActive ? 'page' : undefined}
              onClick={(event) =>
                handleFeedNavClick(event, {
                  isActive,
                  smoothScrollWhenActive: false,
                })
              }
              className={cn(
                'flex min-h-12 w-full min-w-40 items-center gap-x-2 border-b pr-12 transition-colors hover:text-white lg:justify-center lg:pl-12',
                isActive ? 'border-white text-white' : 'border-border text-muted-foreground',
              )}
            >
              <DynamicLucideIcon name={feed.icon} className="size-5 shrink-0" />

              <Typography overrideDefaults className="truncate font-medium lg:text-sm">
                {feed.name}
              </Typography>
            </Link>

            <CustomFeedDialog mode="edit" feed={feed}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={tDialog('editFeedLabel', {
                  name: feed.name,
                })}
                className="absolute top-1/2 right-2 z-10 size-8 -translate-y-1/2 rounded-none bg-transparent opacity-100 shadow-none transition-opacity duration-200 ease-out hover:bg-transparent focus-visible:opacity-100 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100"
                data-testid={`edit-feed-${feed.id}`}
              >
                <Pencil className="size-2.5" />
              </Button>
            </CustomFeedDialog>
          </Container>
        );
      })}

      {/*
        The edit trigger is deliberately a sibling of each feed link. This keeps
        the tab and edit action independently keyboard-accessible and avoids
        nesting a button inside a link.
      */}
      {isAuthenticated ? (
        <CustomFeedDialog mode="create">
          <Button
            overrideDefaults
            className="flex min-h-12 w-full min-w-40 cursor-pointer items-center gap-x-2 border-b border-border text-muted-foreground transition-colors hover:text-white lg:justify-center"
          >
            <PlusCircle className="size-5 shrink-0" />

            <Typography overrideDefaults className="font-medium lg:text-sm">
              {tDialog('createTitle')}
            </Typography>
          </Button>
        </CustomFeedDialog>
      ) : (
        <Button
          overrideDefaults
          className="flex min-h-12 w-full min-w-40 cursor-pointer items-center gap-x-2 border-b border-border text-muted-foreground transition-colors hover:text-white lg:justify-center"
          onClick={() => requireAuth(() => undefined)}
        >
          <PlusCircle className="size-5 shrink-0" />

          <Typography overrideDefaults className="font-medium lg:text-sm">
            {tDialog('createTitle')}
          </Typography>
        </Button>
      )}
    </Container>
  );
};
