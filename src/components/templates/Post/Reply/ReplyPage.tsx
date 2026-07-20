'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getPostRoute } from '@/app/routes';
import { Button } from '@/atoms/Button/Button';
import { Dialog, DialogContent, DialogTitle } from '@/atoms/Dialog/Dialog';
import { useConfirmableDialog } from '@/hooks/useConfirmableDialog/useConfirmableDialog';
import { parseCompositeId } from '@/models/models.utils';
import { DialogConfirmDiscard } from '@/molecules/DialogConfirmDiscard/DialogConfirmDiscard';
import { ReplyComposer } from '@/organisms/ReplyComposer/ReplyComposer';

interface ReplyPageProps {
  postId: string;
}

const REPLY_HISTORY_GUARD_KEY = '__pubkyReplyHistoryGuard';

function enteredThroughClientNavigation(): boolean {
  const navigationEntry = window.performance.getEntriesByType?.('navigation')[0];
  if (!navigationEntry?.name) return false;

  try {
    const documentUrl = new URL(navigationEntry.name, window.location.origin);
    const currentUrl = new URL(window.location.href);
    return (
      documentUrl.origin === currentUrl.origin &&
      `${documentUrl.pathname}${documentUrl.search}` !== `${currentUrl.pathname}${currentUrl.search}`
    );
  } catch {
    return false;
  }
}

export function ReplyPage({ postId }: ReplyPageProps) {
  const t = useTranslations('dialogs.reply');
  const router = useRouter();
  const { pubky, id } = parseCompositeId(postId);
  const parentPostRoute = getPostRoute(pubky, id);
  const guardActiveRef = useRef(false);
  const allowHistoryExitRef = useRef(false);
  const replaceAfterGuardPopRef = useRef(false);
  const enteredInternallyRef = useRef(false);
  const hasContentRef = useRef<() => boolean>(() => false);
  const requestCloseRef = useRef<(open: boolean) => void>(() => undefined);

  const exitRoute = () => {
    if (enteredInternallyRef.current) {
      allowHistoryExitRef.current = true;
      window.history.go(guardActiveRef.current ? -2 : -1);
      return;
    }

    if (guardActiveRef.current) {
      replaceAfterGuardPopRef.current = true;
      window.history.back();
      return;
    }

    router.replace(parentPostRoute);
  };

  const {
    showConfirmDialog,
    setShowConfirmDialog,
    resetKey,
    hasContent,
    handleContentChange,
    handleOpenChange,
    handleDiscard,
  } = useConfirmableDialog({ onClose: exitRoute });
  hasContentRef.current = hasContent ?? (() => false);
  requestCloseRef.current = handleOpenChange;

  useEffect(() => {
    enteredInternallyRef.current = enteredThroughClientNavigation();

    const armHistoryGuard = () => {
      const currentState = window.history.state && typeof window.history.state === 'object' ? window.history.state : {};
      window.history.pushState({ ...currentState, [REPLY_HISTORY_GUARD_KEY]: true }, '', window.location.href);
      guardActiveRef.current = true;
    };

    if (window.history.state?.[REPLY_HISTORY_GUARD_KEY]) {
      guardActiveRef.current = true;
    } else {
      armHistoryGuard();
    }

    const handlePopState = () => {
      guardActiveRef.current = false;

      if (allowHistoryExitRef.current) return;

      if (replaceAfterGuardPopRef.current) {
        replaceAfterGuardPopRef.current = false;
        router.replace(parentPostRoute);
        return;
      }

      if (hasContentRef.current()) {
        armHistoryGuard();
        requestCloseRef.current(false);
        return;
      }

      exitRoute();
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasContentRef.current()) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // The route and router are fixed for the lifetime of this page. Mutable
    // dialog state is read through refs so re-renders never add history guards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentPostRoute, router]);

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        overrideDefaults
        showCloseButton={false}
        className="m-0 flex h-dvh max-h-none w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-none sm:m-0 sm:max-w-none"
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="reply-composer-safe-top z-10 flex shrink-0 items-center gap-2 border-b bg-background px-3 pb-2">
            <Button variant="ghost" size="icon" onClick={() => handleOpenChange(false)} aria-label={t('back')}>
              <ArrowLeft className="size-5" />
            </Button>
            <DialogTitle className="flex-1 text-center text-lg">{t('title')}</DialogTitle>
            <span aria-hidden="true" className="size-9 shrink-0" />
          </header>

          <ReplyComposer
            postId={postId}
            resetKey={resetKey}
            onSuccess={exitRoute}
            onContentChange={handleContentChange}
            presentation="page"
          />
        </main>

        <DialogConfirmDiscard open={showConfirmDialog} onOpenChange={setShowConfirmDialog} onConfirm={handleDiscard} />
      </DialogContent>
    </Dialog>
  );
}
