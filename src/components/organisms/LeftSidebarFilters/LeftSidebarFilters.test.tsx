import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { LeftSidebarFilters } from './LeftSidebarFilters';
import { TIMELINE_FEED_VARIANT } from '@/config';

const mocks = vi.hoisted(() => {
  const mockSetContent = vi.fn();
  const mockUseHomeStore = vi.fn();
  const mockFilterReach = vi.fn((props: Record<string, unknown>) => (
    <div data-testid="filter-reach" data-props={JSON.stringify(props)}>
      FilterReach
    </div>
  ));
  const mockFilterSort = vi.fn((props: Record<string, unknown>) => (
    <div data-testid="filter-sort" data-props={JSON.stringify(props)}>
      FilterSort
    </div>
  ));
  const mockFilterContent = vi.fn((props: Record<string, unknown>) => (
    <div data-testid="filter-content" data-props={JSON.stringify(props)}>
      FilterContent
    </div>
  ));
  const mockFilterLayout = vi.fn(({ showVisual }: { showVisual?: boolean }) => (
    <div data-testid="filter-layout" data-show-visual={showVisual ? 'true' : undefined}>
      FilterLayout
    </div>
  ));
  const mockUseFeedLayoutResolution = vi.fn(() => ({
    requestedLayout: 'columns',
    effectiveLayout: 'columns',
    isVisualRequested: false,
    isVisualActive: false,
    isPhoneViewport: false,
  }));
  return {
    mockSetContent,
    mockUseHomeStore,
    mockFilterReach,
    mockFilterSort,
    mockFilterContent,
    mockFilterLayout,
    mockUseFeedLayoutResolution,
  };
});

vi.mock('@/core', () => ({
  CONTENT: {
    ALL: 'all',
    SHORT: 'short',
    LONG: 'long',
    IMAGES: 'images',
    VIDEOS: 'videos',
    LINKS: 'links',
    FILES: 'files',
  },
  useHomeStore: () => mocks.mockUseHomeStore(),
}));

vi.mock('@/hooks', () => ({
  useFeedLayoutResolution: () => mocks.mockUseFeedLayoutResolution(),
}));

vi.mock('@/atoms', () => ({
  Container: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="container" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/molecules', () => ({
  FilterReach: (props: Record<string, unknown>) => mocks.mockFilterReach(props),
  FilterSort: (props: Record<string, unknown>) => mocks.mockFilterSort(props),
  FilterContent: (props: Record<string, unknown>) => mocks.mockFilterContent(props),
  FilterLayout: (props: { showVisual?: boolean; selectedTab?: string; onTabChange?: (t: string) => void }) =>
    mocks.mockFilterLayout(props),
}));

beforeEach(() => {
  mocks.mockSetContent.mockClear();
  mocks.mockUseHomeStore.mockReturnValue({
    layout: 'columns',
    setLayout: vi.fn(),
    reach: 'following',
    setReach: vi.fn(),
    sort: 'timeline',
    setSort: vi.fn(),
    content: 'all',
    setContent: mocks.mockSetContent,
  });
  mocks.mockFilterReach.mockClear();
  mocks.mockFilterSort.mockClear();
  mocks.mockFilterContent.mockClear();
  mocks.mockFilterLayout.mockClear();
  mocks.mockUseFeedLayoutResolution.mockReturnValue({
    requestedLayout: 'columns',
    effectiveLayout: 'columns',
    isVisualRequested: false,
    isVisualActive: false,
    isPhoneViewport: false,
  });
});

describe('LeftSidebarFilters', () => {
  describe('layoutOnly', () => {
    it('wires disabled reach, sort, and content', () => {
      render(<LeftSidebarFilters layoutOnly variant="sidebar" />);

      expect(mocks.mockFilterReach).toHaveBeenCalledWith(
        expect.objectContaining({ disabled: true, selectedTab: undefined, defaultSelectedTab: undefined }),
      );
      expect(mocks.mockFilterSort).toHaveBeenCalledWith(
        expect.objectContaining({ disabled: true, selectedTab: undefined, defaultSelectedTab: undefined }),
      );
      expect(mocks.mockFilterContent).toHaveBeenCalledWith(
        expect.objectContaining({ disabled: true, selectedTab: undefined, defaultSelectedTab: undefined }),
      );
      expect(mocks.mockFilterLayout).toHaveBeenCalledWith(expect.objectContaining({ showVisual: false }));
    });

    it('matches snapshot (sidebar)', () => {
      const { container } = render(<LeftSidebarFilters layoutOnly variant="sidebar" />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot (drawer)', () => {
      const { container } = render(<LeftSidebarFilters layoutOnly variant="drawer" />);
      expect(container).toMatchSnapshot();
    });
  });

  it('renders interactive filters when not layoutOnly', () => {
    render(<LeftSidebarFilters variant="sidebar" feedVariant={TIMELINE_FEED_VARIANT.HOME} />);

    expect(mocks.mockFilterReach).toHaveBeenCalledWith(
      expect.objectContaining({ selectedTab: 'following', onTabChange: expect.any(Function) }),
    );
    expect(mocks.mockFilterSort).toHaveBeenCalledWith(
      expect.objectContaining({ selectedTab: 'timeline', onTabChange: expect.any(Function) }),
    );
    expect(mocks.mockFilterContent).toHaveBeenCalledWith(
      expect.objectContaining({ onTabChange: expect.any(Function) }),
    );
    expect(mocks.mockFilterLayout).toHaveBeenCalledWith(expect.objectContaining({ showVisual: false }));
  });
});
