import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REACH } from '@/stores/home/home.types';
import { TIMEFRAME } from '@/stores/hot/hot.types';
import { FilterTimeframe, HotFeedDrawer, HotFeedSidebar } from './HotFeedFilters';

const { authPubkyRef, filterReachLastProps, hotStoreMock } = vi.hoisted(() => {
  const authPubkyRef = { current: null as string | null };
  const filterReachLastProps = { current: null as Record<string, unknown> | null };
  let reach = 'all';
  const setReach = vi.fn((r: string) => {
    reach = r;
  });
  const hotStoreMock = {
    get reach() {
      return reach;
    },
    setReach,
    timeframe: 'today',
    setTimeframe: vi.fn(),
    resetReach(r = 'all') {
      reach = r;
    },
    resetMocks() {
      reach = REACH.ALL;
      setReach.mockClear();
      hotStoreMock.setTimeframe.mockClear();
    },
  };
  return { authPubkyRef, filterReachLastProps, hotStoreMock };
});

vi.mock('@/stores/auth/auth.store', () => ({
  useAuthStore: vi.fn((selector: (s: { currentUserPubky: string | null }) => unknown) =>
    selector({ currentUserPubky: authPubkyRef.current }),
  ),
}));

vi.mock('@/stores/hot/hot.store', () => ({
  useHotStore: vi.fn(() => ({
    get reach() {
      return hotStoreMock.reach;
    },
    setReach: hotStoreMock.setReach,
    timeframe: hotStoreMock.timeframe,
    setTimeframe: hotStoreMock.setTimeframe,
  })),
}));

vi.mock('@/molecules/Filters/FilterReach/FilterReach', () => ({
  FilterReach: (props: Record<string, unknown>) => {
    filterReachLastProps.current = props;
    return <div data-testid="filter-reach">FilterReach</div>;
  },
}));

// Mock Atoms
vi.mock('@/atoms/Filter/Filter', () => {
  return {
    FilterRoot: ({ children }: { children: React.ReactNode }) => <div data-testid="filter-root">{children}</div>,
    FilterHeader: ({ title }: { title: string }) => <div data-testid="filter-header">{title}</div>,
    FilterList: ({ children }: { children: React.ReactNode }) => <ul data-testid="filter-list">{children}</ul>,
    FilterItem: ({
      children,
      isSelected,
      onClick,
    }: {
      children: React.ReactNode;
      isSelected: boolean;
      onClick: () => void;
    }) => (
      <li data-testid="filter-item" data-selected={isSelected} onClick={onClick}>
        {children}
      </li>
    ),
    FilterItemIcon: ({ icon: Icon }: { icon: React.ComponentType }) => (
      <span data-testid="filter-icon">
        <Icon />
      </span>
    ),
    FilterItemLabel: ({ children }: { children: React.ReactNode }) => (
      <span data-testid="filter-label">{children}</span>
    ),
  };
});

describe('FilterTimeframe', () => {
  it('renders all timeframe options', () => {
    render(<FilterTimeframe />);

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('calls onTabChange when clicking an option', () => {
    const onTabChange = vi.fn();
    render(<FilterTimeframe selectedTab={TIMEFRAME.TODAY} onTabChange={onTabChange} />);

    fireEvent.click(screen.getByText('This Month'));
    expect(onTabChange).toHaveBeenCalledWith(TIMEFRAME.THIS_MONTH);
  });

  it('matches snapshot', () => {
    const { container } = render(<FilterTimeframe selectedTab={TIMEFRAME.TODAY} />);
    expect(container).toMatchSnapshot();
  });
});

describe('HotFeedSidebar', () => {
  beforeEach(() => {
    authPubkyRef.current = null;
    hotStoreMock.resetMocks();
    filterReachLastProps.current = null;
  });

  it('renders FilterReach and FilterTimeframe', () => {
    render(<HotFeedSidebar />);

    expect(screen.getByTestId('filter-reach')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('passes disabledReachKeys when logged out', () => {
    authPubkyRef.current = null;
    render(<HotFeedSidebar />);

    expect(filterReachLastProps.current?.disabledReachKeys).toEqual([REACH.FOLLOWING, REACH.FRIENDS]);
  });

  it('does not pass disabledReachKeys when logged in', () => {
    authPubkyRef.current = 'gujx6qd8ksydh1makdphd3bxu351d9b8waqka8hfg6q7hnqkxexo';
    render(<HotFeedSidebar />);

    expect(filterReachLastProps.current?.disabledReachKeys).toBeUndefined();
  });

  it('resets reach to all when logged out and reach was following', async () => {
    authPubkyRef.current = null;
    hotStoreMock.resetReach(REACH.FOLLOWING);

    render(<HotFeedSidebar />);

    await waitFor(() => {
      expect(hotStoreMock.setReach).toHaveBeenCalledWith(REACH.ALL);
    });
  });

  it('matches snapshot', () => {
    const { container } = render(<HotFeedSidebar />);
    expect(container).toMatchSnapshot();
  });
});

describe('HotFeedDrawer', () => {
  beforeEach(() => {
    authPubkyRef.current = null;
    hotStoreMock.resetMocks();
    filterReachLastProps.current = null;
  });

  it('renders FilterReach and FilterTimeframe', () => {
    render(<HotFeedDrawer />);

    expect(screen.getByTestId('filter-reach')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('passes disabledReachKeys when logged out', () => {
    authPubkyRef.current = null;
    render(<HotFeedDrawer />);

    expect(filterReachLastProps.current?.disabledReachKeys).toEqual([REACH.FOLLOWING, REACH.FRIENDS]);
  });

  it('matches snapshot', () => {
    const { container } = render(<HotFeedDrawer />);
    expect(container).toMatchSnapshot();
  });
});
