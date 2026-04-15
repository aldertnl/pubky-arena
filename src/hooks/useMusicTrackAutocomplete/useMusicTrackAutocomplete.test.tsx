'use client';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMusicTrackAutocomplete } from './useMusicTrackAutocomplete';
import { MUSIC_TRACK_AUTOCOMPLETE_DEBOUNCE_MS } from './useMusicTrackAutocomplete.constants';

vi.mock('lodash-es', () => ({
  debounce: vi.fn((fn) => {
    const debouncedFn = vi.fn(fn);
    debouncedFn.cancel = vi.fn();
    return debouncedFn;
  }),
}));

describe('useMusicTrackAutocomplete', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty suggestions when query is empty', () => {
    const { result } = renderHook(() => useMusicTrackAutocomplete({ query: '' }));

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns empty suggestions when query is below the minimum length', () => {
    const { result } = renderHook(() => useMusicTrackAutocomplete({ query: 'fe' }));

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches track suggestions when query reaches the minimum length', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          suggestions: [
            {
              id: 'track-1',
              track: 'Feather',
              artist: 'Nujabes feat. Cise Starr',
              album: 'Modal Soul',
              year: '2005',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const { result } = renderHook(() => useMusicTrackAutocomplete({ query: '  fea  ' }));

    await act(async () => {
      vi.advanceTimersByTime(MUSIC_TRACK_AUTOCOMPLETE_DEBOUNCE_MS);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/music-library/track-autocomplete?query=fea');
    expect(result.current.suggestions).toEqual([
      {
        id: 'track-1',
        track: 'Feather',
        artist: 'Nujabes feat. Cise Starr',
        album: 'Modal Soul',
        year: '2005',
      },
    ]);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns empty suggestions when the request fails', async () => {
    mockFetch.mockResolvedValue(new Response('error', { status: 500 }));

    const { result } = renderHook(() => useMusicTrackAutocomplete({ query: 'err' }));

    await act(async () => {
      vi.advanceTimersByTime(MUSIC_TRACK_AUTOCOMPLETE_DEBOUNCE_MS);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('ignores stale responses when query changes', async () => {
    let resolveFirst: (value: Response) => void;
    const firstRequest = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });

    mockFetch.mockReturnValueOnce(firstRequest);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          suggestions: [
            {
              id: 'track-2',
              track: 'Luv(sic.) pt3',
              artist: 'Nujabes feat. Shing02',
              album: null,
              year: '2003',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const { result, rerender } = renderHook(({ query }) => useMusicTrackAutocomplete({ query }), {
      initialProps: { query: 'old' },
    });

    rerender({ query: 'new' });

    await act(async () => {
      vi.advanceTimersByTime(MUSIC_TRACK_AUTOCOMPLETE_DEBOUNCE_MS);
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      resolveFirst!(
        new Response(
          JSON.stringify({
            suggestions: [
              {
                id: 'track-1',
                track: 'Feather',
                artist: 'Nujabes feat. Cise Starr',
                album: 'Modal Soul',
                year: '2005',
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.suggestions).toEqual([
      {
        id: 'track-2',
        track: 'Luv(sic.) pt3',
        artist: 'Nujabes feat. Shing02',
        album: null,
        year: '2003',
      },
    ]);
  });
});
