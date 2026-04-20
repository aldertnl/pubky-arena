'use client';

import { useEffect, useState } from 'react';
import * as Core from '@/core';

interface UseMusicLibraryProfileSummaryResult {
  summary: Core.MusicLibraryProfileSummary | null;
  isLoading: boolean;
}

export function useMusicLibraryProfileSummary(
  pubky: Core.Pubky | null | undefined,
): UseMusicLibraryProfileSummaryResult {
  const [summary, setSummary] = useState<Core.MusicLibraryProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(pubky));

  useEffect(() => {
    let cancelled = false;

    if (!pubky) {
      setSummary(null);
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);

      try {
        const document = await Core.MusicLibraryController.getOrFetchMusicLibraryByPubky(pubky);

        if (cancelled) {
          return;
        }

        setSummary(Core.MusicLibraryNormalizer.toProfileSummary(document));
      } catch {
        if (!cancelled) {
          setSummary(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [pubky]);

  return {
    summary,
    isLoading,
  };
}
