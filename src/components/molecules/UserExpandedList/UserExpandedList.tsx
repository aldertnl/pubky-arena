'use client';

import { useRouter } from 'next/navigation';
import * as Atoms from '@/atoms';
import * as Molecules from '@/molecules';
import * as Hooks from '@/hooks';
import type { Pubky } from '@/core';
import * as Core from '@/core';
import * as Libs from '@/libs';
import { APP_ROUTES } from '@/app/routes';
import type { TaggerWithAvatar } from '@/molecules/TaggedItem/TaggedItem.types';
import { UserExpandedListSkeleton } from './UserExpandedList.skeleton';

interface UserExpandedListProps {
  userIds: Pubky[];
  fallbackUsers?: TaggerWithAvatar[];
  isLoading?: boolean;
  className?: string;
  'data-testid'?: string;
}

const DEFAULT_CLASSNAME =
  'flex max-h-(--user-expanded-list-max-height) w-full max-w-(--user-expanded-list-width) flex-col gap-2 overflow-y-auto rounded-md border border-border bg-popover p-4 shadow-2xl';

/**
 * UserExpandedList
 *
 * Displays a scrollable list of users (taggers, reposters, etc).
 * Shows each user with their avatar, name, pubky, and a follow/unfollow button.
 */
export function UserExpandedList({
  userIds,
  fallbackUsers,
  isLoading: isLoadingUsers,
  className,
  'data-testid': dataTestId,
}: UserExpandedListProps) {
  const router = useRouter();
  const { toggleFollow, isUserLoading } = Hooks.useFollowUser();
  const { requireAuth } = Hooks.useRequireAuth();
  const { currentUserPubky } = Core.useAuthStore();
  const { getUsersWithAvatars } = Hooks.useBulkUserAvatars(userIds);

  const fallbackMap = new Map<string, TaggerWithAvatar>();
  (fallbackUsers ?? []).forEach((user) => {
    fallbackMap.set(user.id, user);
  });

  const users = getUsersWithAvatars(userIds).map((user) => {
    const fallback = fallbackMap.get(user.id);
    return {
      id: user.id,
      name: user.name ?? fallback?.name,
      avatarUrl: user.avatarUrl ?? fallback?.avatarUrl ?? '',
    };
  });

  const handleFollowClick = async (userId: string, isFollowing: boolean) => {
    requireAuth(() => toggleFollow(userId, isFollowing));
  };

  const handleUserClick = (userId: string) => {
    router.push(`${APP_ROUTES.PROFILE}/${userId}`);
  };

  if (userIds.length === 0) {
    return null;
  }

  if (isLoadingUsers) {
    return <UserExpandedListSkeleton />;
  }

  return (
    <Atoms.Container
      aria-label="Users expanded list"
      role="list"
      overrideDefaults
      className={Libs.cn(DEFAULT_CLASSNAME, className)}
      data-testid={dataTestId || 'user-expanded-list'}
    >
      {users.map((user) => (
        <Molecules.TaggerUserRow
          key={user.id}
          tagger={user}
          isLoading={isUserLoading(user.id)}
          isCurrentUser={user.id === currentUserPubky}
          onUserClick={handleUserClick}
          onFollowClick={handleFollowClick}
        />
      ))}
    </Atoms.Container>
  );
}
