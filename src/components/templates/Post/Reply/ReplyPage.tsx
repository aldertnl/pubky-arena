'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/atoms/Button/Button';
import { Typography } from '@/atoms/Typography/Typography';
import { useConfirmableDialog } from '@/hooks/useConfirmableDialog/useConfirmableDialog';
import { DialogConfirmDiscard } from '@/molecules/DialogConfirmDiscard/DialogConfirmDiscard';
import { ReplyComposer } from '@/organisms/ReplyComposer/ReplyComposer';

interface ReplyPageProps {
  postId: string;
}

export function ReplyPage({ postId }: ReplyPageProps) {
  const t = useTranslations('dialogs.reply');
  const router = useRouter();
  const { showConfirmDialog, setShowConfirmDialog, resetKey, handleContentChange, handleOpenChange, handleDiscard } =
    useConfirmableDialog({ onClose: () => router.back() });

  return (
    <main className="fixed inset-0 z-50 flex h-dvh min-h-dvh flex-col overflow-y-auto bg-background">
      <header className="sticky top-0 z-10 grid grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2 border-b bg-background px-3 py-2">
        <Button variant="ghost" size="icon" onClick={() => handleOpenChange(false)} aria-label={t('back')}>
          <ArrowLeft className="size-5" />
        </Button>
        <Typography as="h1" className="text-center text-lg font-bold">
          {t('title')}
        </Typography>
        <span aria-hidden="true" />
      </header>

      <ReplyComposer
        postId={postId}
        resetKey={resetKey}
        onSuccess={() => router.back()}
        onContentChange={handleContentChange}
        presentation="page"
      />

      <DialogConfirmDiscard
        open={showConfirmDialog}
        onOpenChange={() => setShowConfirmDialog(false)}
        onConfirm={handleDiscard}
      />
    </main>
  );
}
