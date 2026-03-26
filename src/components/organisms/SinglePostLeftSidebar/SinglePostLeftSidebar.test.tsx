import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SinglePostLeftSidebar, SinglePostLeftDrawer } from './SinglePostLeftSidebar';

const mockSetLayout = vi.fn();
const mockUseHomeStore = vi.fn();
const mockFilterLayout = vi.fn(
  ({ selectedTab, onTabChange }: { selectedTab?: string; onTabChange?: (tab: string) => void }) => (
    <div data-testid="filter-layout" data-selected-tab={selectedTab}>
      <button data-testid="change-layout" onClick={() => onTabChange?.('wide')}>
        Change layout
      </button>
    </div>
  ),
);

vi.mock('@/core', () => ({
  useHomeStore: () => mockUseHomeStore(),
}));

vi.mock('@/atoms', () => ({
  Container: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="container" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/molecules', () => ({
  FilterReach: () => <div data-testid="filter-reach">FilterReach</div>,
  FilterSort: () => <div data-testid="filter-sort">FilterSort</div>,
  FilterContent: () => <div data-testid="filter-content">FilterContent</div>,
  FilterLayout: ({ selectedTab, onTabChange }: { selectedTab?: string; onTabChange?: (tab: string) => void }) =>
    mockFilterLayout({ selectedTab, onTabChange }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSetLayout.mockClear();
  mockFilterLayout.mockClear();
  mockUseHomeStore.mockReturnValue({
    layout: 'columns',
    setLayout: mockSetLayout,
  });
});

describe('SinglePostLeftSidebar', () => {
  it('renders only FilterLayout', () => {
    render(<SinglePostLeftSidebar />);

    expect(screen.getByTestId('filter-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('filter-reach')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filter-sort')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filter-content')).not.toBeInTheDocument();
  });

  it('passes home layout state to FilterLayout', () => {
    render(<SinglePostLeftSidebar />);

    expect(screen.getByTestId('filter-layout')).toHaveAttribute('data-selected-tab', 'columns');
    expect(screen.getByTestId('container')).toHaveClass('flex', 'flex-col', 'gap-6');
  });

  it('updates home layout when filter tab changes', () => {
    render(<SinglePostLeftSidebar />);

    fireEvent.click(screen.getByTestId('change-layout'));

    expect(mockSetLayout).toHaveBeenCalledWith('wide');
  });

  it('matches snapshot', () => {
    const { container } = render(<SinglePostLeftSidebar />);
    expect(container).toMatchSnapshot();
  });
});

describe('SinglePostLeftDrawer', () => {
  it('renders only FilterLayout', () => {
    render(<SinglePostLeftDrawer />);

    expect(screen.getByTestId('filter-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('filter-reach')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filter-sort')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filter-content')).not.toBeInTheDocument();
  });

  it('passes home layout state to FilterLayout', () => {
    render(<SinglePostLeftDrawer />);

    expect(screen.getByTestId('filter-layout')).toHaveAttribute('data-selected-tab', 'columns');
  });

  it('updates home layout when filter tab changes', () => {
    render(<SinglePostLeftDrawer />);

    fireEvent.click(screen.getByTestId('change-layout'));

    expect(mockSetLayout).toHaveBeenCalledWith('wide');
  });

  it('matches snapshot', () => {
    const { container } = render(<SinglePostLeftDrawer />);
    expect(container).toMatchSnapshot();
  });
});
