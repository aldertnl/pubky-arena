'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslations } from 'next-intl';
import * as Atoms from '@/atoms';
import * as Hooks from '@/hooks';
import * as Libs from '@/libs';
import type { DialogInviteFriendProps } from './DialogInviteFriend.types';

/**
 * DialogInviteFriend
 *
 * Dialog that displays an invite code as a QR code with copy and share actions.
 * Users can share the invite URL to let friends bypass the proof-of-human sign-up.
 *
 * Uses the Homegate API with proof-of-ownership authentication to generate invite codes.
 */
export function DialogInviteFriend({ open, onOpenChange, inviteUrl }: DialogInviteFriendProps) {
  const t = useTranslations('invite');
  const [canShare, setCanShare] = useState(false);

  const { copyToClipboard } = Hooks.useCopyToClipboard({
    successTitle: t('copySuccess'),
  });

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const handleCopy = () => {
    copyToClipboard(inviteUrl);
  };

  const handleShare = async () => {
    try {
      await Libs.shareWithFallback(
        {
          title: t('shareTitle'),
          text: t('shareText'),
          url: inviteUrl,
        },
        {
          onFallback: async () => {
            await copyToClipboard(inviteUrl);
          },
        },
      );
    } catch {
      // Error handled by shareWithFallback callbacks
    }
  };

  return (
    <Atoms.Dialog open={open} onOpenChange={onOpenChange}>
      <Atoms.DialogContent className="sm:max-w-md" hiddenTitle={t('dialogTitle')}>
        <Atoms.Container overrideDefaults className="flex flex-col items-center gap-6">
          {/* Title */}
          <Atoms.Heading level={2} size="lg" className="text-center font-semibold">
            {t('dialogTitle')}
          </Atoms.Heading>

          {/* Explanatory text */}
          <Atoms.Typography className="text-center text-sm text-muted-foreground">{t('description')}</Atoms.Typography>

          {/* QR Code */}
          <Atoms.Container
            overrideDefaults
            className="relative flex h-52 w-52 items-center justify-center rounded-lg bg-white p-2.25"
          >
            <QRCodeSVG value={inviteUrl} size={190} />
            <Image
              src="/images/ring-logo.svg"
              alt="Pubky"
              width={42}
              height={42}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </Atoms.Container>

          {/* Invite URL */}
          <Atoms.Typography
            className="w-full text-center text-sm font-medium break-all text-brand"
            data-testid="invite-url"
          >
            {inviteUrl}
          </Atoms.Typography>

          {/* Action buttons */}
          <Atoms.Container overrideDefaults className="flex w-full gap-3">
            <Atoms.Button variant="outline" className="flex-1" onClick={handleCopy} data-testid="invite-copy-button">
              <Libs.Copy className="size-4" aria-hidden="true" />
              {t('copyButton')}
            </Atoms.Button>

            {canShare && (
              <Atoms.Button variant="brand" className="flex-1" onClick={handleShare} data-testid="invite-share-button">
                <Libs.Share2 className="size-4" aria-hidden="true" />
                {t('shareButton')}
              </Atoms.Button>
            )}
          </Atoms.Container>
        </Atoms.Container>
      </Atoms.DialogContent>
    </Atoms.Dialog>
  );
}
