'use client';

import { useTranslations } from 'next-intl';
import * as Atoms from '@/atoms';
import * as Molecules from '@/molecules';
import * as Hooks from '@/hooks';
import * as Libs from '@/libs';
import { RepostText, NAME_TOKEN } from './RepostText';
import { DESKTOP_NAME_MAX_LENGTH, MAX_VISIBLE_AVATARS, MOBILE_NAME_MAX_LENGTH } from './GroupedRepostHeader.constants';
import { getFirstReposterName, truncateReposterName } from './GroupedRepostHeader.utils';
import { RepostersOverlay } from './RepostersOverlay';
import { PostHeaderTimestamp } from '../PostHeaderTimestamp';
import type { GroupedRepostHeaderProps } from './GroupedRepostHeader.types';

/**
 * GroupedRepostHeader
 *
 * Layout: [Icon] [Middle: username | extra text | avatars] [Timestamp]
 * - Breakpoints: 640px (username truncation), 768px (template + overlay), 1280px (avatars)
 * - On click (multi-reposter only): Dialog (≥768px) or Sheet (<768px)
 */
export function GroupedRepostHeader({
  reposterIds,
  includesCurrentUser,
  earliestTimestamp,
  isExpanded = false,
  onExpandToggle,
}: GroupedRepostHeaderProps) {
  const t = useTranslations('repost');
  const { formatRelativeTime } = Hooks.useRelativeTime();
  const isMobile = Hooks.useIsMobile({ breakpoint: 'md' });

  const isSingleReposter = reposterIds.length === 1;
  const firstReposterId = reposterIds[0]!;
  const timeAgo = formatRelativeTime(new Date(earliestTimestamp));

  const { profile: firstReposter, isLoading: isFirstReposterLoading } = Hooks.useUserProfile(
    includesCurrentUser ? '' : firstReposterId,
  );
  const { users: reposterUsers, isLoading: isUsersLoading } = Hooks.useUserDetailsFromIds({
    userIds: isSingleReposter ? [] : reposterIds,
  });

  const isLoading = isFirstReposterLoading || (!isSingleReposter && isUsersLoading);

  const firstName = getFirstReposterName({
    includesCurrentUser,
    isFirstReposterLoading,
    firstReposterProfile: firstReposter,
    firstReposterId,
    youLabel: t('you'),
  });

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onExpandToggle?.();
  };

  const singleTemplate = t('singleReposted', { name: NAME_TOKEN });
  const mobileTemplate = t('mobileReposted', { name: NAME_TOKEN });
  const desktopTemplate = t('youAndOthersReposted', {
    name: NAME_TOKEN,
    count: reposterIds.length - 1,
  });

  const mobileName = truncateReposterName(firstName, MOBILE_NAME_MAX_LENGTH);
  const desktopName = truncateReposterName(firstName, DESKTOP_NAME_MAX_LENGTH);

  const middleContent = (
    <Atoms.Container className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden" overrideDefaults>
      {isSingleReposter ? (
        <RepostText template={singleTemplate} name={desktopName} />
      ) : (
        <>
          <Atoms.Container className="flex shrink-0 items-center md:hidden" overrideDefaults>
            <Atoms.Container className="shrink-0 sm:hidden" overrideDefaults>
              <RepostText template={mobileTemplate} name={mobileName} />
            </Atoms.Container>
            <Atoms.Container className="hidden shrink-0 sm:flex" overrideDefaults>
              <RepostText template={mobileTemplate} name={desktopName} />
            </Atoms.Container>
          </Atoms.Container>
          <Atoms.Container className="hidden shrink-0 items-center md:flex" overrideDefaults>
            <RepostText template={desktopTemplate} name={desktopName} />
          </Atoms.Container>
        </>
      )}
      {!isSingleReposter && reposterUsers.length > 0 && (
        <Atoms.Container
          className="hidden shrink-0 transition-opacity hover:opacity-80 xl:flex"
          overrideDefaults
          data-testid="grouped-repost-avatars"
        >
          <Molecules.AvatarGroup
            items={reposterUsers}
            totalCount={reposterIds.length}
            maxAvatars={MAX_VISIBLE_AVATARS}
          />
        </Atoms.Container>
      )}
    </Atoms.Container>
  );

  if (isLoading && !includesCurrentUser) {
    return (
      <Atoms.Container
        className="flex h-12 items-center justify-between gap-2 overflow-hidden rounded-t-md bg-muted px-6 py-3 md:h-14 md:gap-3"
        overrideDefaults
        data-testid="grouped-repost-header"
      >
        <Atoms.Container className="flex min-w-0 flex-1 items-center gap-2 md:gap-3" overrideDefaults>
          <Libs.Repeat className="size-4 shrink-0 text-foreground" aria-hidden="true" />
          <Atoms.Container overrideDefaults className="h-6 w-32 animate-pulse rounded bg-muted-foreground/20" />
        </Atoms.Container>
        <PostHeaderTimestamp timeAgo={timeAgo} />
      </Atoms.Container>
    );
  }

  return (
    <>
      <Atoms.Container
        className="flex h-12 items-center justify-between gap-2 overflow-hidden rounded-t-md bg-muted px-6 py-3 md:h-14 md:gap-3"
        overrideDefaults
        data-testid="grouped-repost-header"
      >
        <Libs.Repeat className="size-4 shrink-0 text-foreground" aria-hidden="true" />

        {isSingleReposter ? (
          <Atoms.Container
            className="flex min-w-0 flex-1 items-center gap-3"
            overrideDefaults
            data-testid="grouped-repost-text"
          >
            {middleContent}
          </Atoms.Container>
        ) : (
          <Atoms.Button
            overrideDefaults
            onClick={handleTriggerClick}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 overflow-hidden bg-transparent p-0 text-left"
            aria-label={t('reposters')}
            data-testid="grouped-repost-text"
          >
            {middleContent}
          </Atoms.Button>
        )}

        <PostHeaderTimestamp timeAgo={timeAgo} />
      </Atoms.Container>

      {isExpanded && !isSingleReposter && (
        <RepostersOverlay
          variant={isMobile ? 'sheet' : 'dialog'}
          open={isExpanded}
          onOpenChange={(open) => !open && onExpandToggle?.()}
          reposterIds={reposterIds}
          fallbackReposters={reposterUsers}
        />
      )}
    </>
  );
}
