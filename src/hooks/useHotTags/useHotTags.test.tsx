import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HotController } from '@/controllers/hot/hot';
import { type NexusHotTag, UserStreamTimeframe } from '@/services/nexus/nexus.types';
import { useHotTags } from './useHotTags';

vi.mock('@/controllers/hot/hot', () => ({ HotController: { getOrFetch: vi.fn() } }));

function deferredTags() {
  let resolve!: (tags: NexusHotTag[]) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<NexusHotTag[]>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

const tags: NexusHotTag[] = [{ label: 'pubky', tagged_count: 12, taggers_count: 3, taggers_id: [] }];

describe('Hot topic request changes', () => {
  beforeEach(() => {
    vi.mocked(HotController.getOrFetch).mockReset();
  });

  it.each(['success', 'error'] as const)('ignores an old %s after the timeframe changes', async (outcome) => {
    const previous = deferredTags();
    const current = deferredTags();
    vi.mocked(HotController.getOrFetch).mockReturnValueOnce(previous.promise).mockReturnValueOnce(current.promise);
    const { result, rerender } = renderHook(({ timeframe }) => useHotTags({ timeframe }), {
      initialProps: { timeframe: UserStreamTimeframe.THIS_MONTH },
    });
    rerender({ timeframe: UserStreamTimeframe.TODAY });
    await act(async () => current.resolve(tags));
    await waitFor(() => expect(result.current.rawTags).toEqual(tags));
    await act(async () => {
      if (outcome === 'success') previous.resolve([]);
      else previous.reject('Old request failed');
    });
    expect(result.current.rawTags).toEqual(tags);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('keeps loading the current timeframe when the previous request finishes first', async () => {
    const previous = deferredTags();
    const current = deferredTags();
    vi.mocked(HotController.getOrFetch).mockReturnValueOnce(previous.promise).mockReturnValueOnce(current.promise);
    const { result, rerender } = renderHook(({ timeframe }) => useHotTags({ timeframe }), {
      initialProps: { timeframe: UserStreamTimeframe.THIS_MONTH },
    });
    rerender({ timeframe: UserStreamTimeframe.TODAY });
    await act(async () => previous.resolve(tags));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.rawTags).toEqual([]);
    await act(async () => current.resolve([]));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.rawTags).toEqual([]);
  });
});
