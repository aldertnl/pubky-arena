'use client';

import { useTranslations } from 'next-intl';
import * as Atoms from '@/atoms';
import * as Molecules from '@/molecules';
import * as Hooks from '@/hooks';
import type { Pubky } from '@/core';

interface RepostersOverlayProps {
  reposterPubkys: Pubky[];
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

/**
 * RepostersOverlay
 *
 * Sheet (mobile) / Dialog (desktop) that shows the full list of users
 * who reposted a post. Reuses UserExpandedList for consistent
 * user rows with avatar, name, follow buttons, and profile navigation.
 */
export function RepostersOverlay({ reposterPubkys, open, onOpenChangeAction }: RepostersOverlayProps) {
  const t = useTranslations('post');
  const isMobile = Hooks.useIsMobile();

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const title = t('reposters');
  const list = (
    <Molecules.UserExpandedList
      userIds={reposterPubkys}
      className={isMobile ? 'max-w-full border-0 p-0' : 'border-0 p-0'}
      data-testid="reposter-expanded-list"
    />
  );

  if (isMobile) {
    return (
      <Atoms.Sheet open={open} onOpenChange={onOpenChangeAction}>
        <Atoms.SheetContent
          side="bottom"
          className="rounded-t-2xl pb-8"
          onClick={handleContentClick}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Atoms.SheetHeader className="mb-4">
            <Atoms.SheetTitle>{title}</Atoms.SheetTitle>
          </Atoms.SheetHeader>
          {list}
        </Atoms.SheetContent>
      </Atoms.Sheet>
    );
  }

  return (
    <Atoms.Dialog open={open} onOpenChange={onOpenChangeAction}>
      <Atoms.DialogContent
        className="max-w-md outline-none"
        onClick={handleContentClick}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Atoms.DialogHeader>
          <Atoms.DialogTitle>{title}</Atoms.DialogTitle>
        </Atoms.DialogHeader>
        {list}
      </Atoms.DialogContent>
    </Atoms.Dialog>
  );
}
