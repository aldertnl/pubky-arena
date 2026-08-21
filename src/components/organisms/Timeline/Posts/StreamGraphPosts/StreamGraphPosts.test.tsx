import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UseStreamGraphResult } from '@/hooks/useStreamGraph/useStreamGraph';
import { StreamGraphPosts } from './StreamGraphPosts';

const baseGraph: Partial<UseStreamGraphResult> = {};

vi.mock('@/hooks/useStreamGraph/useStreamGraph', () => ({
  useStreamGraph: () => ({
    nodes: [{ kind: 'user', id: 'user:a', pubky: 'a', name: 'Alice', image: null }],
    edges: [],
    relationships: new Map([['user:a', 'extended']]),
    opacityTiers: new Map([['user:a', 'other']]),
    sizeTiers: new Map([['user:a', 'other']]),
    classCounts: new Map([['extended', 1]]),
    focusId: null,
    selectedNode: null,
    expandedIds: new Set(),
    pathIds: null,
    timeBounds: { min: 1, max: 2 },
    timelineStamps: [1, 2],
    timeCap: null,
    declutter: false,
    hiddenClasses: new Set(),
    isExpanding: false,
    isTracing: false,
    select: vi.fn(),
    expand: vi.fn(),
    refreshNode: vi.fn(),
    recenter: vi.fn(),
    addTag: vi.fn(),
    tracePath: vi.fn(),
    clearPath: vi.fn(),
    toggleClass: vi.fn(),
    toggleDeclutter: vi.fn(),
    setTimeCap: vi.fn(),
    ...baseGraph,
  }),
}));

vi.mock('@/organisms/SocialGraph/SocialGraph', () => ({
  SocialGraph: () => <div data-testid="canvas-stub" />,
}));

vi.mock('@/stores/auth/auth.store', () => ({
  useAuthStore: () => ({ currentUserPubky: null }),
}));

const props = {
  postIds: ['a:1'],
  loading: false,
  loadingMore: false,
  hasMore: true,
  loadMore: vi.fn(),
};

describe('StreamGraphPosts', () => {
  it('renders the canvas, the design pill controls, and the load-more pill', () => {
    render(<StreamGraphPosts {...props} />);

    expect(screen.getByTestId('canvas-stub')).toBeInTheDocument();
    expect(document.querySelector('[data-cy="stream-graph"]')).toBeInTheDocument();
    expect(document.querySelector('[data-cy="graph-controls"]')).toBeInTheDocument();
    expect(document.querySelector('[data-cy="graph-zoom-in"]')).toBeInTheDocument();
    // The legend lives behind the advanced popover now, not on the canvas
    expect(document.querySelector('[data-cy="graph-legend"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-cy="graph-advanced"]')).toBeInTheDocument();
    // Signed out: no recenter pill
    expect(document.querySelector('[data-cy="graph-recenter"]')).not.toBeInTheDocument();

    fireEvent.click(document.querySelector('[data-cy="stream-graph-load-more"]')!);
    expect(props.loadMore).toHaveBeenCalled();
  });

  it('hides load-more when the stream is exhausted', () => {
    render(<StreamGraphPosts {...props} hasMore={false} />);
    expect(document.querySelector('[data-cy="stream-graph-load-more"]')).not.toBeInTheDocument();
  });
});
