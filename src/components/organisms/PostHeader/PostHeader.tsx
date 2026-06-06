'use client';

import { Container } from '@/atoms/Container/Container';
import { useAvatarUrl } from '@/hooks/useAvatarUrl/useAvatarUrl';
import { usePostDetails } from '@/hooks/usePostDetails/usePostDetails';
import { useRelativeTime } from '@/hooks/useRelativeTime/useRelativeTime';
import { useUserDetails } from '@/hooks/useUserDetails/useUserDetails';
import { PostHeaderTimestamp } from '@/molecules/PostHeaderTimestamp/PostHeaderTimestamp';
import { PostHeaderUserInfo } from '@/molecules/PostHeaderUserInfo/PostHeaderUserInfo';
import { PostHomeserverVerifyIcon } from '@/molecules/PostHomeserverVerifyIcon/PostHomeserverVerifyIcon';
import { PostHeaderSkeleton } from './PostHeader.skeleton';
import type { PostHeaderProps } from './PostHeader.types';

export function PostHeader({
  postId,
  isReplyInput = false,
  characterLimit,
  showPopover = true,
  size = 'normal',
  timeAgoPlacement = 'top-right',
}: PostHeaderProps) {
  // Extract userId from postId (format: userId:postId or just userId if isReplyInput is true)
  const userId = isReplyInput ? postId : postId.split(':')[0];

  // When isReplyInput is true, skip fetching post details since there's no post yet
  const { postDetails } = usePostDetails(isReplyInput ? null : postId);

  // Fetch user details for avatar and name
  const { userDetails } = useUserDetails(userId);

  // Compute avatar URL from user details (only if the user has an image)
  const avatarUrl = useAvatarUrl(userDetails);

  const { formatRelativeTime } = useRelativeTime();

  const isLoading = !userDetails || (!isReplyInput && !postDetails);

  if (isLoading) {
    return <PostHeaderSkeleton />;
  }

  const indexedAt = !isReplyInput && postDetails ? new Date(postDetails.indexed_at) : null;
  const timeAgo = indexedAt ? formatRelativeTime(indexedAt) : null;

  return (
    <Container className="flex w-full min-w-0 items-start justify-between gap-3" overrideDefaults>
      <PostHeaderUserInfo
        userId={userId}
        userName={userDetails.name || ''}
        avatarUrl={avatarUrl}
        characterLimit={characterLimit}
        showPopover={showPopover}
        size={size}
        timeAgo={timeAgoPlacement === 'bottom-left' ? timeAgo : null}
        indexedAt={timeAgoPlacement === 'bottom-left' ? indexedAt : null}
        postId={timeAgoPlacement === 'bottom-left' && !isReplyInput ? postId : undefined}
      />
      {timeAgo && timeAgoPlacement === 'top-right' && (
        <Container className="flex flex-shrink-0 items-center gap-2.5" overrideDefaults>
          <PostHeaderTimestamp timeAgo={timeAgo} indexedAt={indexedAt} showExactTimeTooltip={false} />
          {!isReplyInput && <PostHomeserverVerifyIcon postId={postId} />}
        </Container>
      )}
    </Container>
  );
}
