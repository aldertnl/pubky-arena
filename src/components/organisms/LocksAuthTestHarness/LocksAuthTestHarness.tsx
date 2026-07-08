'use client';

// TODO:[Locks] #2026 — temporary dev/staging test harness for the Lock-auth flow. Exposes
// `window.locksdk.start()` to open the auth modal (gated to dev/staging). Delete when the real
// lock switch (#2026) drives the modal from the post composer.
import { useEffect, useState } from 'react';
import type { Session as LocksSdkSession } from '@pubky/locks-sdk';
import { useRestoreLocksAuth } from '@/hooks/useRestoreLocksAuth/useRestoreLocksAuth';
import { Env } from '@/libs/env/env';
import { isLocksAuthTestEnabled } from '@/libs/locks/isLocksAuthTestEnabled';
import { Logger } from '@/libs/logger/logger';
import { DialogLocksAuth } from '@/organisms/DialogLocksAuth/DialogLocksAuth';

declare global {
  interface Window {
    locksdk?: { start: () => void };
  }
}

/** Masks a bearer secret to a safe prefix…suffix so it never lands in logs in full. */
const maskSecret = (secret: string): string =>
  secret.length <= 8 ? '***' : `${secret.slice(0, 4)}…${secret.slice(-4)}`;

export function LocksAuthTestHarness() {
  const enabled = isLocksAuthTestEnabled();
  const lockServer = Env.NEXT_PUBLIC_LOCK_SERVER ?? '';
  const [open, setOpen] = useState(false);

  // Restore a persisted Locks session on load.
  useRestoreLocksAuth(enabled && lockServer ? lockServer : null);

  useEffect(() => {
    if (!enabled) return;
    window.locksdk = {
      start: () => {
        if (!lockServer) {
          Logger.warn('[locksdk] NEXT_PUBLIC_LOCK_SERVER is not set');
          return;
        }
        setOpen(true);
      },
    };
    return () => {
      delete window.locksdk;
    };
  }, [enabled, lockServer]);

  if (!enabled || !lockServer) return null;

  const handleSuccess = (session: LocksSdkSession) => {
    // Safe summary only — never the full bearer secret.
    Logger.info('[locksdk] authenticated', {
      lockServer: session.lockServer(),
      secret: maskSecret(session.exportSecret()),
    });
    setOpen(false);
  };

  return <DialogLocksAuth open={open} onOpenChange={setOpen} lockServerPubky={lockServer} onSuccess={handleSuccess} />;
}
