'use client';

import type { ReactNode } from 'react';
import * as Atoms from '@/atoms';
import * as Libs from '@/libs';
import type { MusicLibraryConsentState } from '@/hooks/useMusicLibrary/useMusicLibrary';

interface MusicLibraryConsentProps {
  consent: MusicLibraryConsentState;
  isSaving?: boolean;
  onConsentChangeAction: (field: keyof MusicLibraryConsentState, value: boolean) => Promise<void> | void;
}

export function MusicLibraryConsent({
  consent,
  isSaving = false,
  onConsentChangeAction,
}: MusicLibraryConsentProps) {
  return (
    <Atoms.Card>
      <Atoms.CardHeader>
        <Atoms.CardTitle>Music Library Consent</Atoms.CardTitle>
        <Atoms.CardDescription className="space-y-1 break-words">
          <p>External recommendation, advertising, or buyer access is blocked until you opt in.</p>
          <p>Consent can be revoked anytime</p>
        </Atoms.CardDescription>
      </Atoms.CardHeader>
      <Atoms.CardContent>
        <Atoms.Container className="gap-4">
          <Atoms.Container className="gap-3 rounded-xl border border-dashed border-brand/30 bg-background/80 p-4">
            <Atoms.Container overrideDefaults={true} className="flex min-w-0 items-start gap-3">
              <Libs.Lightbulb className="mt-1 size-4 shrink-0 text-brand" />
              <Atoms.Container overrideDefaults={true} className="min-w-0 gap-1">
                <Atoms.Badge variant="outline" className="w-fit text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                  How it works
                </Atoms.Badge>
                <Atoms.Typography as="p" className="text-sm font-semibold text-foreground">
                  Your music data can create real revenue
                </Atoms.Typography>
                <Atoms.Typography as="p" className="break-words text-sm leading-6 text-muted-foreground">
                  This experiment is not just about yes or no permission. It is about enabling buyer access and
                  recommendation use in ways that can generate value and return benefits to the user who contributed the
                  music information.
                </Atoms.Typography>
              </Atoms.Container>
            </Atoms.Container>
          </Atoms.Container>
          <ConsentRow
            title="Allow buyer app sharing"
            description="Let a buyer-facing app read this music data so future deals, licensing, or revenue opportunities can directly benefit the user who provided it."
            icon={<Libs.Wallet className="size-4 text-brand" />}
            checked={consent.buyerSharingEnabled}
            disabled={isSaving || !consent.marketingEnabled}
            onCheckedChange={(checked) => void onConsentChangeAction('buyerSharingEnabled', checked)}
          />
          <ConsentRow
            title="Allow recommendation or marketing use"
            description="Allow recommendation, promotion, or advertising use of this music data when that usage helps create measurable value that can be shared back with the contributing user."
            icon={<Libs.TrendingUp className="size-4 text-brand" />}
            checked={consent.marketingEnabled}
            disabled={isSaving}
            onCheckedChange={(checked) => void onConsentChangeAction('marketingEnabled', checked)}
          />
        </Atoms.Container>
      </Atoms.CardContent>
    </Atoms.Card>
  );
}

function ConsentRow({
  title,
  description,
  icon,
  checked,
  disabled,
  onCheckedChange,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Atoms.Container className="gap-3 rounded-xl border bg-muted/20 p-4">
      <Atoms.Container
        overrideDefaults={true}
        className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
      >
        <Atoms.Container overrideDefaults={true} className="flex min-w-0 items-start gap-3">
          <Atoms.Container
            overrideDefaults={true}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10"
          >
            {icon}
          </Atoms.Container>
          <Atoms.Container overrideDefaults={true} className="min-w-0 gap-1">
            <Atoms.Typography as="p" className="font-semibold text-foreground">
              {title}
            </Atoms.Typography>
            <Atoms.Typography as="p" className="break-words text-sm leading-6 text-muted-foreground">
              {description}
            </Atoms.Typography>
          </Atoms.Container>
        </Atoms.Container>
        <Atoms.Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} className="shrink-0" />
      </Atoms.Container>
    </Atoms.Container>
  );
}
