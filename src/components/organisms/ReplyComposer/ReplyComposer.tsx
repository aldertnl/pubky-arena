'use client';

import { Container } from '@/atoms/Container/Container';
import { usePostDetails } from '@/hooks/usePostDetails/usePostDetails';
import { cn, isPostDeleted } from '@/libs/utils/utils';
import { PostPreviewCard } from '@/molecules/PostPreviewCard/PostPreviewCard';
import { POST_INPUT_VARIANT } from '@/organisms/PostInput/PostInput.constants';
import { PostInput } from '../PostInput/PostInput';
import type { ReplyComposerProps } from './ReplyComposer.types';

export function ReplyComposer({
  postId,
  resetKey,
  onSuccess,
  onContentChange,
  presentation = 'dialog',
}: ReplyComposerProps) {
  const isPage = presentation === 'page';
  const { postDetails } = usePostDetails(postId);
  const canReply = !isPage || Boolean(postDetails && !isPostDeleted(postDetails.content));

  return (
    <Container
      className={cn(
        'min-h-0 flex-1 gap-3 overflow-x-hidden overscroll-contain',
        isPage ? 'reply-composer-safe-bottom px-4 py-3' : 'pr-1',
      )}
    >
      {isPage ? (
        <Container inert overrideDefaults className="max-h-40 shrink-0 overflow-hidden rounded-md">
          <PostPreviewCard postId={postId} interactiveActions={false} navigable={false} />
        </Container>
      ) : (
        <PostPreviewCard postId={postId} />
      )}

      {canReply && (
        <Container className={cn('relative w-full min-w-0', !isPage && 'pl-6')} overrideDefaults>
          <PostInput
            dataCy="reply-post-input"
            id="reply-post-input"
            key={resetKey}
            autoFocusTextarea
            variant={POST_INPUT_VARIANT.REPLY}
            postId={postId}
            onSuccess={onSuccess}
            showThreadConnector={!isPage}
            expanded={true}
            onContentChange={onContentChange}
          />
        </Container>
      )}
    </Container>
  );
}
