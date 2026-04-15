'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import * as Atoms from '@/atoms';
import * as Hooks from '@/hooks';
import * as Libs from '@/libs';
import * as Molecules from '@/molecules';
import * as Organisms from '@/organisms';
import type { InviteFriendProps } from './InviteFriend.types';

/**
 * InviteFriend
 *
 * Sidebar section that allows authenticated users to generate and share an invite code.
 * Shows a brand button that opens a dialog with QR code, invite URL, and copy/share actions.
 *
 * Uses the Homegate API with proof-of-ownership authentication to generate invite codes.
 * Always fetches a fresh code on every button click to ensure the code is valid
 * (codes can be used at any time, so a previously fetched code may no longer be valid).
 */
export function InviteFriend({ className }: InviteFriendProps) {
  const t = useTranslations('invite');
  const { currentUserPubky } = Hooks.useCurrentUserProfile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { inviteUrl, isLoading, fetchInviteCode } = Hooks.useInviteCode();

  const handleInviteClick = async () => {
    const success = await fetchInviteCode();
    if (success) {
      setIsDialogOpen(true);
    }
  };

  // Only show for authenticated users
  if (!currentUserPubky) {
    return null;
  }

  return (
    <>
      <Molecules.SidebarSection title={t('sectionTitle')} className={className} data-testid="invite-friend">
        <Atoms.Button
          variant="brand"
          className="w-full"
          onClick={handleInviteClick}
          disabled={isLoading}
          data-testid="invite-friend-button"
        >
          {isLoading ? (
            <Libs.Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Libs.Gift className="size-4" aria-hidden="true" />
          )}
          {t('buttonLabel')}
        </Atoms.Button>
      </Molecules.SidebarSection>

      {inviteUrl && (
        <Organisms.DialogInviteFriend open={isDialogOpen} onOpenChange={setIsDialogOpen} inviteUrl={inviteUrl} />
      )}
    </>
  );
}
