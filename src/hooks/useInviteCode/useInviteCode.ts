'use client';

import { useState } from 'react';

import { HomegateController } from '@/core';
import { INVITE_BASE_URL } from '@/config';
import { Logger } from '@/libs';
import type { UseInviteCodeResult } from './useInviteCode.types';

/**
 * useInviteCode
 *
 * Manages the invite code generation flow.
 * Calls the Homegate API to generate an invite code via proof-of-ownership.
 * Always fetches a fresh code on every call to ensure the code is valid
 * (codes can be used at any time, so a previously fetched code may no longer be valid).
 *
 * @returns The invite code state and fetch function
 */
export function useInviteCode(): UseInviteCodeResult {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteUrl = inviteCode ? `${INVITE_BASE_URL}/${inviteCode}` : null;

  const fetchInviteCode = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await HomegateController.fetchInviteCode();
      setInviteCode(result.signupCode);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate invite code';
      Logger.error('[useInviteCode] Failed to fetch invite code', { error: err });
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    inviteCode,
    inviteUrl,
    isLoading,
    error,
    fetchInviteCode,
  };
}
