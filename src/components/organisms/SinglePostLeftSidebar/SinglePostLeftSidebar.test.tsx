import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SinglePostLeftSidebar, SinglePostLeftDrawer } from './SinglePostLeftSidebar';

const mocks = vi.hoisted(() => {
  const mockSetLayout = vi.fn();
  const mockUseHomeStore = vi.fn();
  const mockFilterReach = vi.fn(({ disabled }: { disabled?: boolean }) => (
    <div data-testid="filter-reach" data-disabled={disabled ? 'true' : 'false'}>
      FilterReach
    </div>
  ));
  const mockFilterSort = vi.fn(({ disabled }: { disabled?: boolean }) => (
    <div data-testid="filter-sort" data-disabled={disabled ? 'true' : 'false'}>
      FilterSort
    </div>
  ));
  const mockFilterContent = vi.fn(({ disabled }: { disabled?: boolean }) => (
    <div data-testid="filter-content" data-disabled={disabled ? 'true' : 'false'}>
      FilterContent
    </div>
  ));
  const mockFilterLayout = vi.fn(
    ({ selectedTab, onTabChange }: { selectedTab?: string; onTabChange?: (tab: string) => void }) => (
      <div data-testid="filter-layout" data-selected-tab={selectedTab}>
        <button data-testid="change-layout" onClick={() => onTabChange?.('wide')}>
          Change layout
        </button>
      </div>
    ),
  );
  const mockUseFeedLayoutResolution = vi.fn(() => ({
    requestedLayout: 'columns',
    effectiveLayout: 'columns',
    isVisualRequested: false,
    isVisualActive: false,
    isPhoneViewport: false,
  }));
  return {
    mockSetLayout,
    mockUseHomeStore,
    mockFilterReach,
    mockFilterSort,
    mockFilterContent,
    mockFilterLayout,
    mockUseFeedLayoutResolution,
  };
});

vi.mock('@/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core')>();
  return {
    ...actual,
    useHomeStore: () => mocks.mockUseHomeStore(),
  };
});

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
  FilterReach: (props: { disabled?: boolean }) => mocks.mockFilterReach(props),
  FilterSort: (props: { disabled?: boolean }) => mocks.mockFilterSort(props),
  FilterContent: (props: { disabled?: boolean }) => mocks.mockFilterContent(props),
  FilterLayout: ({ selectedTab, onTabChange }: { selectedTab?: string; onTabChange?: (tab: string) => void }) =>
    mocks.mockFilterLayout({ selectedTab, onTabChange }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockSetLayout.mockClear();
  mocks.mockFilterReach.mockClear();
  mocks.mockFilterSort.mockClear();
  mocks.mockFilterContent.mockClear();
  mocks.mockFilterLayout.mockClear();
  mocks.mockUseHomeStore.mockReturnValue({
    layout: 'columns',
    setLayout: mocks.mockSetLayout,
    reach: 'following',
    setReach: vi.fn(),
    sort: 'timeline',
    setSort: vi.fn(),
    content: 'all',
    setContent: vi.fn(),
  });
  mocks.mockUseFeedLayoutResolution.mockReturnValue({
    requestedLayout: 'columns',
    effectiveLayout: 'columns',
    isVisualRequested: false,
    isVisualActive: false,
    isPhoneViewport: false,
  });
});

describe('SinglePostLeftSidebar', () => {
  it('renders reach, sort, layout, and content with non-layout filters disabled', () => {
    render(<SinglePostLeftSidebar />);

    expect(screen.getByTestId('filter-layout')).toBeInTheDocument();
    expect(screen.getByTestId('filter-reach')).toBeInTheDocument();
    expect(screen.getByTestId('filter-sort')).toBeInTheDocument();
    expect(screen.getByTestId('filter-content')).toBeInTheDocument();
    expect(screen.getByTestId('filter-reach')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByTestId('filter-sort')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByTestId('filter-content')).toHaveAttribute('data-disabled', 'true');
    expect(mocks.mockFilterReach).toHaveBeenCalled();
    expect(mocks.mockFilterSort).toHaveBeenCalled();
    expect(mocks.mockFilterContent).toHaveBeenCalled();
  });

  it('passes home layout state to FilterLayout', () => {
    render(<SinglePostLeftSidebar />);

    expect(screen.getByTestId('filter-layout')).toHaveAttribute('data-selected-tab', 'columns');
    expect(screen.getAllByTestId('container')[0]).toHaveClass('flex', 'flex-col', 'gap-6');
  });

  it('updates home layout when filter tab changes', () => {
    render(<SinglePostLeftSidebar />);

    fireEvent.click(screen.getByTestId('change-layout'));

    expect(mocks.mockSetLayout).toHaveBeenCalledWith('wide');
  });

  it('matches snapshot', () => {
    const { container } = render(<SinglePostLeftSidebar />);
    expect(container).toMatchSnapshot();
  });
});

describe('SinglePostLeftDrawer', () => {
  it('renders reach, sort, layout, and content with non-layout filters disabled', () => {
    render(<SinglePostLeftDrawer />);

    expect(screen.getByTestId('filter-layout')).toBeInTheDocument();
    expect(screen.getByTestId('filter-reach')).toBeInTheDocument();
    expect(screen.getByTestId('filter-sort')).toBeInTheDocument();
    expect(screen.getByTestId('filter-content')).toBeInTheDocument();
    expect(mocks.mockFilterReach).toHaveBeenCalled();
    expect(mocks.mockFilterSort).toHaveBeenCalled();
    expect(mocks.mockFilterContent).toHaveBeenCalled();
  });

  it('passes home layout state to FilterLayout', () => {
    render(<SinglePostLeftDrawer />);

    expect(screen.getByTestId('filter-layout')).toHaveAttribute('data-selected-tab', 'columns');
  });

  it('updates home layout when filter tab changes', () => {
    render(<SinglePostLeftDrawer />);

    fireEvent.click(screen.getByTestId('change-layout'));

    expect(mocks.mockSetLayout).toHaveBeenCalledWith('wide');
  });

  it('matches snapshot', () => {
    const { container } = render(<SinglePostLeftDrawer />);
    expect(container).toMatchSnapshot();
  });
});
