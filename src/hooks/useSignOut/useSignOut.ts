'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_ROUTES } from '@/app/routes';
import type { UseSignOutResult } from './useSignOut.types';

export function useSignOut(): UseSignOutResult {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = () => {
    // Navigate first; `/logout` owns session cleanup so we do not clear Dexie
    // while this page's queries are still in flight.
    setIsLoading(true);
    router.push(AUTH_ROUTES.LOGOUT);
  };

  return {
    handleSignOut,
    isLoading,
  };
}
