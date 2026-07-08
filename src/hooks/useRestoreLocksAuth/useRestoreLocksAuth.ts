'use client';

import { useEffect } from 'react';
import { LocksAuthController } from '@/controllers/locksAuth/locksAuth';
import { useLocksAuthStore } from '@/stores/locksAuth/locksAuth.store';

/**
 * Restores the Locks session from the persisted bearer secret once the store has hydrated.
 *
 * `lockServerPubky` is null until the Lock Server config is wired; restore no-ops until then. Mount
 * once high in the app tree, alongside the homeserver restore.
 *
 * TODO:[Locks] #2025 — real app-load mount lands with the composer lock-switch gate; today this is
 * mounted only inside `LocksAuthTestHarness` (dev/staging). Wire it high in the app tree there.
 */
export function useRestoreLocksAuth(lockServerPubky: string | null): void {
  const hasHydrated = useLocksAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated || !lockServerPubky) return;
    LocksAuthController.restorePersistedLocksSession({ lockServerPubky });
  }, [hasHydrated, lockServerPubky]);
}
