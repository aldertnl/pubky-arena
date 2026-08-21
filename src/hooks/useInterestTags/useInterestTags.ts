'use client';

import { useState } from 'react';
import { STARTER_PACK_MAX_TAGS } from '@/config/nexus';
import { isValidTagLabel } from '@/libs/utils/utils';
import type { UseInterestTagsResult } from './useInterestTags.types';

/** Canonical form shared with starter pack stream IDs: trimmed + lowercase. */
export function canonicalizeInterestTag(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Manages the ordered interest tag selection for the onboarding "Tags of interest" step.
 *
 * Selection order is preserved (it is part of the starter pack stream ID), labels are
 * canonicalized to the stream ID contract, duplicates are ignored (a free-text entry that
 * matches a popular chip simply selects that chip), and the selection is capped at
 * `STARTER_PACK_MAX_TAGS`.
 */
export function useInterestTags(): UseInterestTagsResult {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const isAtLimit = selectedTags.length >= STARTER_PACK_MAX_TAGS;

  const isSelected = (raw: string): boolean => selectedTags.includes(canonicalizeInterestTag(raw));

  const addTag = (raw: string): void => {
    const tag = canonicalizeInterestTag(raw);
    if (!isValidTagLabel(tag)) return;
    setSelectedTags((prev) => (prev.includes(tag) || prev.length >= STARTER_PACK_MAX_TAGS ? prev : [...prev, tag]));
  };

  const removeTag = (raw: string): void => {
    const tag = canonicalizeInterestTag(raw);
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const toggleTag = (raw: string): void => {
    if (isSelected(raw)) {
      removeTag(raw);
    } else {
      addTag(raw);
    }
  };

  return { selectedTags, addTag, removeTag, toggleTag, isSelected, isAtLimit };
}
