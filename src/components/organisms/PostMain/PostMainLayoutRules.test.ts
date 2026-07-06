import { describe, expect, it } from 'vitest';
import { LAYOUT } from '@/stores/home/home.types';
import { getCollectionCardLayoutForSurfaceLayout, getTagsLayoutForSurfaceLayout } from './PostMainLayoutRules';

describe('PostMainLayoutRules', () => {
  describe('getTagsLayoutForSurfaceLayout', () => {
    it('maps WIDE to side tags layout', () => {
      expect(getTagsLayoutForSurfaceLayout(LAYOUT.WIDE)).toBe('side');
    });

    it('maps non-WIDE layouts to inline tags layout', () => {
      expect(getTagsLayoutForSurfaceLayout(LAYOUT.COLUMNS)).toBe('inline');
      expect(getTagsLayoutForSurfaceLayout(LAYOUT.VISUAL)).toBe('inline');
    });
  });

  describe('getCollectionCardLayoutForSurfaceLayout', () => {
    it('maps WIDE to wide collection card layout', () => {
      expect(getCollectionCardLayoutForSurfaceLayout(LAYOUT.WIDE)).toBe('wide');
    });

    it('maps non-WIDE layouts to default collection card layout', () => {
      expect(getCollectionCardLayoutForSurfaceLayout(LAYOUT.COLUMNS)).toBe('default');
      expect(getCollectionCardLayoutForSurfaceLayout(LAYOUT.VISUAL)).toBe('default');
    });
  });
});
