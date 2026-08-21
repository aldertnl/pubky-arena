import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STARTER_PACK_MAX_TAGS } from '@/config/nexus';
import { useInterestTags } from './useInterestTags';

describe('useInterestTags', () => {
  it('starts with an empty selection below the limit', () => {
    const { result } = renderHook(() => useInterestTags());

    expect(result.current.selectedTags).toEqual([]);
    expect(result.current.isAtLimit).toBe(false);
  });

  it('adds tags preserving selection order', () => {
    const { result } = renderHook(() => useInterestTags());

    act(() => result.current.addTag('bitcoin'));
    act(() => result.current.addTag('art'));
    act(() => result.current.addTag('photography'));

    expect(result.current.selectedTags).toEqual(['bitcoin', 'art', 'photography']);
  });

  it('canonicalizes labels on add (trim + lowercase)', () => {
    const { result } = renderHook(() => useInterestTags());

    act(() => result.current.addTag('  Bitcoin  '));

    expect(result.current.selectedTags).toEqual(['bitcoin']);
  });

  it('dedupes case-insensitively across popular and free-text entries', () => {
    const { result } = renderHook(() => useInterestTags());

    act(() => result.current.addTag('bitcoin'));
    act(() => result.current.addTag('Bitcoin'));
    act(() => result.current.addTag('BITCOIN '));

    expect(result.current.selectedTags).toEqual(['bitcoin']);
  });

  it('rejects invalid labels (empty, whitespace-only, banned characters, overlength)', () => {
    const { result } = renderHook(() => useInterestTags());

    act(() => result.current.addTag(''));
    act(() => result.current.addTag('   '));
    act(() => result.current.addTag('tag with space'));
    act(() => result.current.addTag('tag,comma'));
    act(() => result.current.addTag('tag:colon'));
    act(() => result.current.addTag('a'.repeat(21)));

    expect(result.current.selectedTags).toEqual([]);
  });

  it(`caps the selection at STARTER_PACK_MAX_TAGS (${STARTER_PACK_MAX_TAGS})`, () => {
    const { result } = renderHook(() => useInterestTags());

    for (let i = 0; i < STARTER_PACK_MAX_TAGS + 2; i++) {
      act(() => result.current.addTag(`tag${i}`));
    }

    expect(result.current.selectedTags).toHaveLength(STARTER_PACK_MAX_TAGS);
    expect(result.current.selectedTags).toEqual(['tag0', 'tag1', 'tag2', 'tag3', 'tag4']);
    expect(result.current.isAtLimit).toBe(true);
  });

  it('still allows removal at the cap', () => {
    const { result } = renderHook(() => useInterestTags());

    for (let i = 0; i < STARTER_PACK_MAX_TAGS; i++) {
      act(() => result.current.addTag(`tag${i}`));
    }
    expect(result.current.isAtLimit).toBe(true);

    act(() => result.current.removeTag('tag2'));

    expect(result.current.selectedTags).toEqual(['tag0', 'tag1', 'tag3', 'tag4']);
    expect(result.current.isAtLimit).toBe(false);
  });

  it('removes tags matching on the canonical form', () => {
    const { result } = renderHook(() => useInterestTags());

    act(() => result.current.addTag('bitcoin'));
    act(() => result.current.removeTag(' Bitcoin '));

    expect(result.current.selectedTags).toEqual([]);
  });

  it('toggles: adds when unselected, removes when selected', () => {
    const { result } = renderHook(() => useInterestTags());

    act(() => result.current.toggleTag('bitcoin'));
    expect(result.current.selectedTags).toEqual(['bitcoin']);

    act(() => result.current.toggleTag('Bitcoin'));
    expect(result.current.selectedTags).toEqual([]);
  });

  it('reports isSelected using the canonical form', () => {
    const { result } = renderHook(() => useInterestTags());

    act(() => result.current.addTag('bitcoin'));

    expect(result.current.isSelected('Bitcoin')).toBe(true);
    expect(result.current.isSelected('art')).toBe(false);
  });

  it('ignores additions beyond the cap without reordering existing tags', () => {
    const { result } = renderHook(() => useInterestTags());

    for (let i = 0; i < STARTER_PACK_MAX_TAGS; i++) {
      act(() => result.current.addTag(`tag${i}`));
    }

    act(() => result.current.addTag('overflow'));

    expect(result.current.selectedTags).toEqual(['tag0', 'tag1', 'tag2', 'tag3', 'tag4']);
    expect(result.current.isSelected('overflow')).toBe(false);
  });
});
