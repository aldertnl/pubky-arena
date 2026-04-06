'use client';

import type { ReactNode } from 'react';
import * as Atoms from '@/atoms';
import * as Molecules from '@/molecules';
import * as Core from '@/core';
import * as Hooks from '@/hooks';
import { TIMELINE_FEED_VARIANT } from '@/config';
import {
  resolveVisualFeedContent,
  VISUAL_DISABLED_CONTENT,
} from '../Timeline/Feed/TimelineFeed/TimelineFeedVisual.helpers';
import type { LeftSidebarFiltersProps } from './LeftSidebarFilters.types';

type LeftSidebarColumnProps = {
  variant: 'sidebar' | 'drawer';
  reach?: ReactNode;
  sort: ReactNode;
  layout: ReactNode;
  content: ReactNode;
};

/**
 * LeftSidebarColumn
 *
 * Presentational shell only: Reach → Sort → Layout → Content, gap-6, sticky grouping
 * for Layout+Content on desktop sidebar. Lives here as the single callsite.
 */
function LeftSidebarColumn({ variant, reach, sort, layout, content }: LeftSidebarColumnProps) {
  return (
    <Atoms.Container overrideDefaults className="flex flex-col gap-6">
      {reach}
      {sort}
      {variant === 'sidebar' ? (
        <Atoms.Container overrideDefaults className="sticky top-[100px] flex w-full flex-col gap-6 self-start">
          {layout}
          {content}
        </Atoms.Container>
      ) : (
        <>
          {layout}
          {content}
        </>
      )}
    </Atoms.Container>
  );
}

/**
 * LeftSidebarFilters
 *
 * Home store + timeline helpers + filter molecules, composed into LeftSidebarColumn.
 * Used by Home feed and SinglePost left panels.
 */
export function LeftSidebarFilters({
  hideReachFilter = false,
  hideLayoutFilter = false,
  allowVisualLayout = false,
  layoutOnly = false,
  feedVariant = TIMELINE_FEED_VARIANT.HOME,
  variant = 'drawer',
}: LeftSidebarFiltersProps) {
  const { layout, setLayout, reach, setReach, sort, setSort, content, setContent } = Core.useHomeStore();
  const { isPhoneViewport, isVisualActive } = Hooks.useFeedLayoutResolution(feedVariant);

  const feedDerived = layoutOnly
    ? {
        resolvedContent: undefined,
        disabledContentTabs: [],
        showVisualLayout: false,
      }
    : {
        resolvedContent: resolveVisualFeedContent({
          content,
          variant: feedVariant,
          isVisualActive,
        }),
        disabledContentTabs: isVisualActive ? VISUAL_DISABLED_CONTENT : [],
        showVisualLayout: allowVisualLayout && !isPhoneViewport,
      };

  const reachProps = layoutOnly
    ? { selectedTab: undefined, defaultSelectedTab: undefined, disabled: true as const }
    : { selectedTab: reach, onTabChange: setReach };

  const sortProps = layoutOnly
    ? { selectedTab: undefined, defaultSelectedTab: undefined, disabled: true as const }
    : { selectedTab: sort, onTabChange: setSort };

  const contentProps = layoutOnly
    ? { selectedTab: undefined, defaultSelectedTab: undefined, disabled: true as const }
    : {
        selectedTab: feedDerived.resolvedContent,
        onTabChange: setContent,
        disabledTabs: feedDerived.disabledContentTabs,
      };

  const reachFilter = !hideReachFilter && <Molecules.FilterReach {...reachProps} />;
  const sortFilter = <Molecules.FilterSort {...sortProps} />;

  const layoutFilter = !hideLayoutFilter && (
    <Molecules.FilterLayout selectedTab={layout} onTabChange={setLayout} showVisual={feedDerived.showVisualLayout} />
  );

  const contentFilter = <Molecules.FilterContent {...contentProps} />;

  return (
    <LeftSidebarColumn
      variant={variant}
      reach={reachFilter || undefined}
      sort={sortFilter}
      layout={layoutFilter || null}
      content={contentFilter}
    />
  );
}
