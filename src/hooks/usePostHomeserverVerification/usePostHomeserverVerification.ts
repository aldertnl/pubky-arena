'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  getPostHomeserverVerificationSnapshot,
  runPostHomeserverVerification,
  subscribePostHomeserverVerification,
} from './postHomeserverVerificationCoordinator';
import type { UsePostHomeserverVerificationResult } from './usePostHomeserverVerification.types';

export function usePostHomeserverVerification(
  compositeId: string | null,
): UsePostHomeserverVerificationResult {
  const status = useSyncExternalStore(
    compositeId
      ? (listener) => subscribePostHomeserverVerification(compositeId, listener)
      : () => () => {},
    () => (compositeId ? getPostHomeserverVerificationSnapshot(compositeId) : 'idle'),
    () => 'idle' as const,
  );

  const verify = useCallback(async () => {
    if (!compositeId || status === 'checking' || status === 'verified') return;
    await runPostHomeserverVerification(compositeId);
  }, [compositeId, status]);

  return {
    status,
    verify,
    isVerified: status === 'verified',
  };
}
