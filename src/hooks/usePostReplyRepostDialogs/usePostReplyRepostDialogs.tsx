'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPostReplyRoute } from '@/app/routes';
import { useIsMobile } from '@/hooks/useIsMobile/useIsMobile';
import { parseCompositeId } from '@/models/models.utils';
import { DialogReply } from '@/organisms/DialogReply/DialogReply';
import { DialogRepost } from '@/organisms/DialogRepost/DialogRepost';
import type { DialogRepostConfig } from '@/organisms/DialogRepost/DialogRepost.types';

export function usePostReplyRepostDialogs(postId: string, repostConfig?: DialogRepostConfig) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);

  const openReply = () => {
    if (isMobile) {
      const { pubky, id } = parseCompositeId(postId);
      router.push(getPostReplyRoute(pubky, id));
      return;
    }

    setReplyDialogOpen(true);
  };

  const openRepostDialog = () => {
    setRepostDialogOpen(true);
  };

  return {
    openReply,
    openRepostDialog,
    dialogs: (
      <>
        <DialogReply postId={postId} open={replyDialogOpen} onOpenChangeAction={setReplyDialogOpen} />
        <DialogRepost
          postId={postId}
          open={repostDialogOpen}
          onOpenChangeAction={setRepostDialogOpen}
          config={repostConfig}
        />
      </>
    ),
  };
}
