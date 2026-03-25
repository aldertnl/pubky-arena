import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SinglePostLeftSidebar, SinglePostLeftDrawer } from './SinglePostLeftSidebar';

const mockSetLayout = vi.fn();
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
  useHomeStore: () => ({
    layout: 'columns',
    setLayout: mockSetLayout,
  }),
}));

vi.mock('@/atoms', () => ({
  Container: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="container" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/molecules', () => ({
  FilterLayout: ({ selectedTab, onTabChange }: { selectedTab?: string; onTabChange?: (tab: string) => void }) =>
    mockFilterLayout({ selectedTab, onTabChange }),
}));

describe('SinglePostLeftSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FilterLayout with home layout state', () => {
    render(<SinglePostLeftSidebar />);

    expect(screen.getByTestId('filter-layout')).toBeInTheDocument();
    expect(screen.getByTestId('filter-layout')).toHaveAttribute('data-selected-tab', 'columns');
    expect(screen.getByTestId('container')).toHaveClass('flex', 'flex-col', 'gap-6');
  });

  it('updates layout when filter tab changes', () => {
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FilterLayout with home layout state', () => {
    render(<SinglePostLeftDrawer />);

    expect(screen.getByTestId('filter-layout')).toBeInTheDocument();
    expect(screen.getByTestId('filter-layout')).toHaveAttribute('data-selected-tab', 'columns');
  });

  it('matches snapshot', () => {
    const { container } = render(<SinglePostLeftDrawer />);
    expect(container).toMatchSnapshot();
  });
});
