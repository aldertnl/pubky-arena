'use client';

import { useState } from 'react';
import * as Core from '@/core';
import * as Atoms from '@/atoms';
import * as Molecules from '@/molecules';
import * as Organisms from '@/organisms';
import * as Hooks from '@/hooks';
import * as Libs from '@/libs';
import { POST_TAGS_MAX_COUNT, POST_TAGS_MAX_LENGTH, POST_TAGS_MAX_TOTAL_CHARS } from '@/config';
import type { TagsLayout } from '../../PostMain/PostMain.types';

interface GroupedRepostPostProps {
  item: Core.RepostGroupItem;
  onClick?: () => void;
  tagsLayout?: TagsLayout;
}

/**
 * GroupedRepostPost
 *
 * Renders a grouped repost: GroupedRepostHeader on top, then the
 * original post content via PostHeader + PostContent. The post actions
 * (reply, repost, tags) target the original post.
 *
 * NOTE: The card body (PostHeader, PostContent, tags, actions) intentionally
 * duplicates PostMain's layout. Extracting a shared PostCardBody was evaluated
 * but rejected — PostMain has thread connectors, TTL subscription, header
 * visibility guards, and dual tag panel refs that would require 8+ conditional
 * props, making the abstraction worse than the duplication. Keep both in sync
 * manually. See also: src/components/organisms/PostMain/PostMain.tsx
 */
export function GroupedRepostPost({ item, onClick, tagsLayout }: GroupedRepostPostProps) {
  const isMobile = Hooks.useIsMobile();
  const effectiveTagsLayout = tagsLayout === 'side' && isMobile ? 'inline' : tagsLayout;
  const { postDetails } = Hooks.usePostDetails(item.originalPostId);
  const isDeleted = Libs.isPostDeleted(postDetails?.content);
  const currentUserPubky = Core.useAuthStore((state) => state.currentUserPubky);

  const currentUserRepostIdx = currentUserPubky != null ? item.reposterPubkys.indexOf(currentUserPubky) : -1;
  const currentUserRepostId = currentUserRepostIdx >= 0 ? item.repostPostIds[currentUserRepostIdx] : undefined;

  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const handleFooterClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <>
      <Atoms.Container overrideDefaults className="relative flex min-w-0">
        <Atoms.Card className={Libs.cn('min-w-0 flex-1 gap-0 rounded-md py-0')}>
          {isDeleted ? (
            <Molecules.PostDeleted />
          ) : (
            <>
              <Molecules.GroupedRepostHeader
                reposterPubkys={item.reposterPubkys}
                earliestTimestamp={item.earliestTimestamp}
              />
              <Atoms.CardContent onClick={onClick} className="flex min-w-0 cursor-pointer flex-col gap-4 p-6">
                {effectiveTagsLayout === 'side' ? (
                  <Atoms.Container className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
                    <Atoms.Container className="flex min-w-0 flex-col gap-4 lg:col-span-2">
                      <Organisms.PostHeader postId={item.originalPostId} timeAgoPlacement="bottom-left" />
                      <Organisms.PostContent postId={item.originalPostId} />
                      <Atoms.Container overrideDefaults onClick={handleFooterClick} className="flex flex-col gap-4">
                        <Organisms.PostTagsPanel postId={item.originalPostId} widthMode="full" className="lg:hidden" />
                        <Organisms.PostActionsBar
                          postId={item.originalPostId}
                          onTagClick={() => setTagsExpanded((prev) => !prev)}
                          onReplyClick={() => setReplyDialogOpen(true)}
                          onRepostClick={() => setRepostDialogOpen(true)}
                          currentUserRepostId={currentUserRepostId}
                        />
                      </Atoms.Container>
                    </Atoms.Container>
                    <Atoms.Container overrideDefaults onClick={handleFooterClick} className="hidden lg:flex">
                      <Organisms.PostTagsPanel postId={item.originalPostId} widthMode="full" />
                    </Atoms.Container>
                  </Atoms.Container>
                ) : (
                  <>
                    <Organisms.PostHeader postId={item.originalPostId} />
                    <Organisms.PostContent postId={item.originalPostId} />
                    <Atoms.Container
                      onClick={handleFooterClick}
                      className={Libs.cn(
                        'flex-col items-start gap-2 md:flex-row md:justify-between md:gap-4',
                        tagsExpanded ? 'md:items-end' : 'md:items-start',
                      )}
                    >
                      {tagsExpanded ? (
                        <Organisms.PostTagsPanel
                          postId={item.originalPostId}
                          widthMode="fit"
                          autoFocusInput
                          enableLoadingSkeleton={false}
                          className="flex-1"
                        />
                      ) : (
                        <Organisms.ClickableTagsList
                          taggedId={item.originalPostId}
                          taggedKind={Core.TagKind.POST}
                          maxTags={POST_TAGS_MAX_COUNT}
                          maxTagLength={POST_TAGS_MAX_LENGTH}
                          maxTotalChars={POST_TAGS_MAX_TOTAL_CHARS}
                          showCount={true}
                          showInput={false}
                          showAddButton={true}
                          addMode={true}
                        />
                      )}
                      <Organisms.PostActionsBar
                        postId={item.originalPostId}
                        onTagClick={() => setTagsExpanded((prev) => !prev)}
                        onReplyClick={() => setReplyDialogOpen(true)}
                        onRepostClick={() => setRepostDialogOpen(true)}
                        currentUserRepostId={currentUserRepostId}
                        className="shrink-0 justify-start md:justify-end"
                      />
                    </Atoms.Container>
                  </>
                )}
              </Atoms.CardContent>
            </>
          )}
        </Atoms.Card>
      </Atoms.Container>
      <Organisms.DialogReply
        postId={item.originalPostId}
        open={replyDialogOpen}
        onOpenChangeAction={setReplyDialogOpen}
      />
      <Organisms.DialogRepost
        postId={item.originalPostId}
        open={repostDialogOpen}
        onOpenChangeAction={setRepostDialogOpen}
      />
    </>
  );
}
