import { LAYOUT, type LayoutType } from '@/stores/home/home.types';
import type { TagsLayout } from './PostMain.types';

export type CollectionCardLayout = 'default' | 'wide';

/**
 * Canonical mapping from app layout mode to post tags layout.
 * Surface entry points derive this once, then downstream post renderers inherit it.
 */
export function getTagsLayoutForSurfaceLayout(layout: LayoutType): TagsLayout {
  return layout === LAYOUT.WIDE ? 'side' : 'inline';
}

/**
 * Canonical mapping from app layout mode to collection card layout.
 * Wide feed layout renders full-width collection cards with larger typography.
 */
export function getCollectionCardLayoutForSurfaceLayout(layout: LayoutType): CollectionCardLayout {
  return layout === LAYOUT.WIDE ? 'wide' : 'default';
}
