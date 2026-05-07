import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HomeFeedRightDrawer,
  HomeFeedRightDrawerMobile,
  HomeFeedRightSidebar,
  HotFeedRightDrawer,
  HotFeedRightSidebar,
} from './FeedRightSidebar';

const { authState } = vi.hoisted(() => ({
  authState: { currentUserPubky: null as string | null },
}));

vi.mock('@/stores/auth/auth.store', () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

// Mock Molecules
vi.mock('@/molecules/FeedSection/FeedSection', () => {
  return {
    FeedSection: () => <div data-testid="feed-section">FeedSection</div>,
  };
});

// Mock Organisms
vi.mock('@/organisms/ActiveUsers/ActiveUsers', () => {
  return {
    ActiveUsers: () => <div data-testid="active-users">ActiveUsers</div>,
  };
});

vi.mock('@/organisms/FeedbackCard/FeedbackCard', () => {
  return {
    FeedbackCard: () => <div data-testid="feedback-card">FeedbackCard</div>,
  };
});

vi.mock('@/organisms/HotTags/HotTags', () => {
  return {
    HotTags: () => <div data-testid="hot-tags">HotTags</div>,
  };
});

vi.mock('@/organisms/WhoToFollowSidebar/WhoToFollowSidebar', () => {
  return {
    WhoToFollowSidebar: () => <div data-testid="who-to-follow">WhoToFollowSidebar</div>,
  };
});

beforeEach(() => {
  authState.currentUserPubky = null;
});

describe('HomeFeedRightSidebar', () => {
  it('renders all components', () => {
    render(<HomeFeedRightSidebar />);

    expect(screen.getByTestId('who-to-follow')).toBeInTheDocument();
    expect(screen.getByTestId('active-users')).toBeInTheDocument();
    expect(screen.getByTestId('hot-tags')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-card')).toBeInTheDocument();
  });

  it('hides WhoToFollow and FeedbackCard for guests when guestPublicExplore', () => {
    authState.currentUserPubky = null;
    render(<HomeFeedRightSidebar guestPublicExplore />);

    expect(screen.queryByTestId('who-to-follow')).not.toBeInTheDocument();
    expect(screen.getByTestId('active-users')).toBeInTheDocument();
    expect(screen.getByTestId('hot-tags')).toBeInTheDocument();
    expect(screen.queryByTestId('feedback-card')).not.toBeInTheDocument();
  });

  it('shows all blocks for signed-in user when guestPublicExplore', () => {
    authState.currentUserPubky = 'gujx6qd8ksydh1makdphd3bxu351d9b8waqka8hfg6q7hnqkxexo';
    render(<HomeFeedRightSidebar guestPublicExplore />);

    expect(screen.getByTestId('who-to-follow')).toBeInTheDocument();
    expect(screen.getByTestId('active-users')).toBeInTheDocument();
    expect(screen.getByTestId('hot-tags')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-card')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<HomeFeedRightSidebar />);
    expect(container).toMatchSnapshot();
  });
});

describe('HomeFeedRightDrawer', () => {
  it('renders all components', () => {
    render(<HomeFeedRightDrawer />);

    expect(screen.getByTestId('who-to-follow')).toBeInTheDocument();
    expect(screen.getByTestId('active-users')).toBeInTheDocument();
    expect(screen.getByTestId('hot-tags')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-card')).toBeInTheDocument();
  });

  it('hides WhoToFollow and FeedbackCard for guests when guestPublicExplore', () => {
    authState.currentUserPubky = null;
    render(<HomeFeedRightDrawer guestPublicExplore />);

    expect(screen.queryByTestId('who-to-follow')).not.toBeInTheDocument();
    expect(screen.getByTestId('active-users')).toBeInTheDocument();
    expect(screen.getByTestId('hot-tags')).toBeInTheDocument();
    expect(screen.queryByTestId('feedback-card')).not.toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<HomeFeedRightDrawer />);
    expect(container).toMatchSnapshot();
  });
});

describe('HomeFeedRightDrawerMobile', () => {
  it('renders FeedSection', () => {
    render(<HomeFeedRightDrawerMobile />);

    expect(screen.getByTestId('feed-section')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<HomeFeedRightDrawerMobile />);
    expect(container).toMatchSnapshot();
  });
});

describe('HotFeedRightSidebar', () => {
  it('hides WhoToFollow and FeedbackCard when logged out', () => {
    authState.currentUserPubky = null;
    render(<HotFeedRightSidebar />);

    expect(screen.queryByTestId('who-to-follow')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feedback-card')).not.toBeInTheDocument();
  });

  it('shows WhoToFollow and FeedbackCard when authenticated', () => {
    authState.currentUserPubky = 'gujx6qd8ksydh1makdphd3bxu351d9b8waqka8hfg6q7hnqkxexo';
    render(<HotFeedRightSidebar />);

    expect(screen.getByTestId('who-to-follow')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-card')).toBeInTheDocument();
  });

  it('matches snapshot when logged out', () => {
    authState.currentUserPubky = null;
    const { container } = render(<HotFeedRightSidebar />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when authenticated', () => {
    authState.currentUserPubky = 'gujx6qd8ksydh1makdphd3bxu351d9b8waqka8hfg6q7hnqkxexo';
    const { container } = render(<HotFeedRightSidebar />);
    expect(container).toMatchSnapshot();
  });
});

describe('HotFeedRightDrawer', () => {
  it('hides WhoToFollow and FeedbackCard when logged out', () => {
    authState.currentUserPubky = null;
    render(<HotFeedRightDrawer />);

    expect(screen.queryByTestId('who-to-follow')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feedback-card')).not.toBeInTheDocument();
  });

  it('shows WhoToFollow and FeedbackCard when authenticated', () => {
    authState.currentUserPubky = 'gujx6qd8ksydh1makdphd3bxu351d9b8waqka8hfg6q7hnqkxexo';
    render(<HotFeedRightDrawer />);

    expect(screen.getByTestId('who-to-follow')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-card')).toBeInTheDocument();
  });

  it('matches snapshot when logged out', () => {
    authState.currentUserPubky = null;
    const { container } = render(<HotFeedRightDrawer />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when authenticated', () => {
    authState.currentUserPubky = 'gujx6qd8ksydh1makdphd3bxu351d9b8waqka8hfg6q7hnqkxexo';
    const { container } = render(<HotFeedRightDrawer />);
    expect(container).toMatchSnapshot();
  });
});
