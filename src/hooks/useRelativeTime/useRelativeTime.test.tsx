import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRelativeTime } from './useRelativeTime';

describe('useRelativeTime', () => {
  const now = new Date('2026-07-16T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const DAY = 24 * 60 * 60 * 1000;

  it.each([
    ['4s', 4 * 1000],
    ['3m', 3 * 60 * 1000],
    ['7h', 7 * 60 * 60 * 1000],
    ['2d', 2 * DAY],
    ['5w', 5 * 7 * DAY],
    ['6w', 6 * 7 * DAY],
    ['6M', 6 * 30 * DAY],
  ])('formats %s timestamps with a compact label', (expected, elapsedMs) => {
    const { result } = renderHook(() => useRelativeTime());

    expect(result.current.formatRelativeTime(new Date(now.getTime() - elapsedMs))).toBe(expected);
  });

  it('does not show negative values for future timestamps', () => {
    const { result } = renderHook(() => useRelativeTime());

    expect(result.current.formatRelativeTime(new Date(now.getTime() + 10 * 1000))).toBe('0s');
  });

  it.each([
    ['59s', 59 * 1000, '1m', 60 * 1000],
    ['59m', 59 * 60 * 1000, '1h', 60 * 60 * 1000],
    ['23h', 23 * 60 * 60 * 1000, '1d', 24 * 60 * 60 * 1000],
    ['6d', 6 * DAY, '1w', 7 * DAY],
    ['7w', 55 * DAY, '2M', 56 * DAY],
  ])('does not skip or go backwards across the %s / %s boundary', (belowExpected, belowMs, atExpected, atMs) => {
    const { result } = renderHook(() => useRelativeTime());

    expect(result.current.formatRelativeTime(new Date(now.getTime() - belowMs))).toBe(belowExpected);
    expect(result.current.formatRelativeTime(new Date(now.getTime() - atMs))).toBe(atExpected);
  });

  it('never reports less elapsed time as the real elapsed time grows (exhaustive sweep, 0s to 10y)', () => {
    const { result } = renderHook(() => useRelativeTime());
    const { formatRelativeTime } = result.current;

    const SECOND = 1000;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    // seconds-equivalent of each unit's label, used only to check the label sequence
    // never implies less time than a previous label as real elapsed time increases.
    const UNIT_SECONDS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800, M: 2592000 };

    function labelSeconds(elapsedMs: number): number {
      const label = formatRelativeTime(new Date(now.getTime() - elapsedMs));
      const match = label.match(/^(\d+)([smhdwM])$/);
      if (!match) throw new Error(`Unexpected label format: "${label}" at elapsedMs=${elapsedMs}`);
      return Number(match[1]) * UNIT_SECONDS[match[2]];
    }

    function assertNonDecreasing(elapsedMsValues: number[]) {
      let prev = -Infinity;
      for (const elapsedMs of elapsedMsValues) {
        const seconds = labelSeconds(elapsedMs);
        expect(seconds).toBeGreaterThanOrEqual(prev);
        prev = seconds;
      }
    }

    // every second up to just under an hour (covers s->m and m->h boundaries)
    assertNonDecreasing(Array.from({ length: 3600 }, (_, s) => s * SECOND));
    // every minute up to just under a day (covers m->h and h->d boundaries)
    assertNonDecreasing(Array.from({ length: 1440 }, (_, m) => m * MINUTE));
    // every hour up to just under a week (covers h->d and d->w boundaries)
    assertNonDecreasing(Array.from({ length: 168 }, (_, h) => h * HOUR));
    // every day for 10 years (covers d->w and w->M boundaries, and all later M values)
    assertNonDecreasing(Array.from({ length: 3650 }, (_, d) => d * DAY));
  });
});
