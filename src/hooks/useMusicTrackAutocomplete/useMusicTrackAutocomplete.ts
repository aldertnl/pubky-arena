'use client';

import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash-es';
import type { UseMusicTrackAutocompleteParams, UseMusicTrackAutocompleteResult, MusicTrackSuggestion } from './useMusicTrackAutocomplete.types';
import {
  MUSIC_TRACK_AUTOCOMPLETE_CACHE_TTL_MS,
  MUSIC_TRACK_AUTOCOMPLETE_DEBOUNCE_MS,
  MUSIC_TRACK_AUTOCOMPLETE_MIN_QUERY_LENGTH,
} from './useMusicTrackAutocomplete.constants';

interface MusicTrackAutocompleteResponse {
  suggestions: MusicTrackSuggestion[];
}

const musicTrackAutocompleteCache = new Map<
  string,
  {
    data: MusicTrackAutocompleteResponse;
    timestamp: number;
  }
>();

export function useMusicTrackAutocomplete({
  query,
  enabled = true,
}: UseMusicTrackAutocompleteParams): UseMusicTrackAutocompleteResult {
  const [suggestions, setSuggestions] = useState<MusicTrackSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);

  const debouncedSearchRef = useRef(
    debounce(async (searchQuery: string) => {
      const requestId = ++requestIdRef.current;
      const apiUrl = `/api/music-library/track-autocomplete?query=${encodeURIComponent(searchQuery)}`;
      const cached = musicTrackAutocompleteCache.get(apiUrl);

      setIsLoading(true);

      if (cached && Date.now() - cached.timestamp < MUSIC_TRACK_AUTOCOMPLETE_CACHE_TTL_MS) {
        setSuggestions(cached.data.suggestions);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error('Failed to fetch track suggestions');
        }

        const data = (await response.json()) as MusicTrackAutocompleteResponse;

        if (requestId !== requestIdRef.current) {
          return;
        }

        musicTrackAutocompleteCache.set(apiUrl, {
          data,
          timestamp: Date.now(),
        });
        setSuggestions(data.suggestions);
      } catch {
        if (requestId === requestIdRef.current) {
          setSuggestions([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, MUSIC_TRACK_AUTOCOMPLETE_DEBOUNCE_MS),
  );

  useEffect(() => {
    const debouncedFn = debouncedSearchRef.current;
    return () => {
      debouncedFn.cancel();
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!enabled || trimmedQuery.length < MUSIC_TRACK_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
      debouncedSearchRef.current.cancel();
      requestIdRef.current += 1;
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const debouncedFn = debouncedSearchRef.current;
    debouncedFn(trimmedQuery);

    return () => {
      debouncedFn.cancel();
    };
  }, [enabled, query]);

  return {
    suggestions,
    isLoading,
  };
}
