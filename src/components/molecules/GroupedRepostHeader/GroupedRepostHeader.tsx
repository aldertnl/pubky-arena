'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import * as Libs from '@/libs';
import * as Core from '@/core';
import * as Atoms from '@/atoms';
import * as Molecules from '@/molecules';
import * as Hooks from '@/hooks';
import type { Pubky } from '@/core';
import { RepostersOverlay } from './RepostersOverlay/RepostersOverlay';

interface GroupedRepostHeaderProps {
  reposterPubkys: Pubky[];
  earliestTimestamp: number;
}

/**
 * GroupedRepostHeader
 *
 * Header displayed above a grouped repost, showing who reposted.
 * When the current user is among the reposters, displays "You" instead of their name.
 * Desktop: repeat icon + bold text + avatar group + timestamp
 * Mobile: repeat icon + truncated text + timestamp (no avatars)
 */
export function GroupedRepostHeader({ reposterPubkys, earliestTimestamp }: GroupedRepostHeaderProps) {
  const t = useTranslations('post');
  const isMobile = Hooks.useIsMobile();
  const { formatRelativeTime } = Hooks.useRelativeTime();
  const { users } = Hooks.useUserDetailsFromIds({ userIds: reposterPubkys });
  const currentUserPubky = Core.useAuthStore((state) => state.currentUserPubky);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const timeAgo = formatRelativeTime(new Date(earliestTimestamp));
  const indexedAt = new Date(earliestTimestamp);

  const isCurrentUserReposter = currentUserPubky != null && reposterPubkys.includes(currentUserPubky);
  const count = reposterPubkys.length;
  const otherUsers = isCurrentUserReposter ? users.filter((u) => u.id !== currentUserPubky) : users;

  const repostText = getRepostText(t, count, isMobile, isCurrentUserReposter, users, otherUsers);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (count > 1) setOverlayOpen(true);
  };

  return (
    <>
      <Atoms.Container
        className={Libs.cn('flex items-center gap-3 rounded-t-md bg-muted px-4 py-3', count > 1 && 'cursor-pointer')}
        overrideDefaults
        data-testid="grouped-repost-header"
        onClick={handleClick}
        role={count > 1 ? 'button' : undefined}
      >
        <Libs.Repeat className="size-5 shrink-0" aria-label="Repeat" />

        <Atoms.Typography as="span" className="min-w-0 truncate text-base font-bold text-foreground" overrideDefaults>
          {repostText}
        </Atoms.Typography>

        {!isMobile && users.length > 0 && (
          <Molecules.AvatarGroup items={users} totalCount={count} maxAvatars={6} data-testid="grouped-repost-avatars" />
        )}

        <Atoms.Container overrideDefaults className="ml-auto shrink-0">
          <Molecules.PostHeaderTimestamp timeAgo={timeAgo} indexedAt={indexedAt} />
        </Atoms.Container>
      </Atoms.Container>

      {count > 1 && (
        <RepostersOverlay reposterPubkys={reposterPubkys} open={overlayOpen} onOpenChangeAction={setOverlayOpen} />
      )}
    </>
  );
}

function getRepostText(
  t: ReturnType<typeof useTranslations<'post'>>,
  count: number,
  isMobile: boolean,
  isCurrentUser: boolean,
  allUsers: { id: string; name?: string }[],
  otherUsers: { id: string; name?: string }[],
): string {
  if (isCurrentUser) {
    if (count === 1) return t('repostedByYouOnly');
    if (isMobile) return t('repostedByYouMobile');
    if (count === 2) return t('repostedByYouAndOne', { name: otherUsers[0]?.name || '?' });
    return t('repostedByYouAndMany', { count: count - 1 });
  }

  const firstName = allUsers[0]?.name || '?';
  if (count === 1) return t('repostedByOne', { name: firstName });
  if (isMobile) return t('repostedByManyMobile', { name: firstName });
  if (count === 2) return t('repostedByTwo', { name1: firstName, name2: allUsers[1]?.name || '?' });
  return t('repostedByMany', { name: firstName, count: count - 1 });
}
