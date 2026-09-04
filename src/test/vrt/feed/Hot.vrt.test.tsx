// Intentional import order — vi.hoisted + vi.mock factories rely on stable
// Vitest `__vi_import_N__` aliases; reordering causes a TDZ crash in
// @vitest/browser. Do not let `eslint --fix` reorder these imports.
/* eslint-disable simple-import-sort/imports */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { matchVrtFrameScreenshot, renderForVRT } from '@/test-utils/vrt';
import { formatStableRelative } from '@/test-utils/vrt.clock';
import { VRT_VIEWPORT_DESKTOP, VRT_VIEWPORT_MOBILE } from '@/test-utils/vrt.viewports';
import { createZustandLikeHook } from '@/test-utils/stores';
import { Header } from '@/organisms/Header/Header';
import { Hot } from '@/templates/Feed/Hot/Hot';
import { page } from 'vitest/browser';

// Keep the deliberately randomized card rotations reproducible in screenshots.
let restoreRotationRandom: (() => void) | undefined;
beforeEach(() => {
  const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
  restoreRotationRandom = () => random.mockRestore();
});
afterEach(() => restoreRotationRandom?.());

// Browser-mode vi.mock factories run before top-level imports resolve and have
// no synchronous require(), so each factory loads its fixture via async import
// the first time the mocked module is consumed. The fixture modules are pure
// data so the per-factory cost is negligible.
const fixtures = vi.hoisted(async () => {
  const [postsModule, profilesModule, whoToFollowModule, navModule, hotTagsModule, mockApp] = await Promise.all([
    import('@/test/fixtures/feed/posts'),
    import('@/test/fixtures/feed/profiles'),
    import('@/test/fixtures/feed/whoToFollow'),
    import('@/test/fixtures/feed/feedNavigation'),
    import('@/test/fixtures/feed/hotTags'),
    import('@/test/mocks/feedApplication'),
  ]);
  const postsByCompositeId = new Map(postsModule.VRT_FEED_POSTS.map((post) => [post.compositeId, post]));
  const orderedCompositeIds = postsModule.VRT_FEED_POSTS.map((post) => post.compositeId);
  const compositeIdByUri = new Map(postsModule.VRT_FEED_POSTS.map((post) => [post.details.uri, post.compositeId]));
  const viewerPubky = profilesModule.VRT_AUTHOR_PUBKYS.alice;
  const rawHotTags = [...hotTagsModule.VRT_HOT_TAGS];
  const hotTags = rawHotTags.map((tag) => ({ name: tag.label, count: tag.tagged_count }));
  return {
    postsByCompositeId,
    orderedCompositeIds,
    compositeIdByUri,
    profiles: profilesModule.VRT_AUTHOR_PROFILES,
    viewerPubky,
    whoToFollow: whoToFollowModule.VRT_WHO_TO_FOLLOW,
    homeFilters: navModule.VRT_HOME_FILTERS,
    rawHotTags,
    hotTags,
    mockFeedApplication: mockApp.mockFeedApplication,
  };
});

vi.mock('next/navigation', () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  };
  const params = {};
  const searchParams = new URLSearchParams();
  return {
    useRouter: () => router,
    usePathname: () => '/arena',
    useSearchParams: () => searchParams,
    useParams: () => params,
  };
});

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: <T,>(fn: () => T | Promise<T>, _deps?: unknown[], initial?: T): T => {
    const result = fn();
    if (result instanceof Promise) return initial as T;
    return result;
  },
}));

vi.mock('@/stores/home/home.store', async () => {
  const f = await fixtures;
  return {
    useHomeStore: createZustandLikeHook({
      ...f.homeFilters,
      setLayout: vi.fn(),
      setSort: vi.fn(),
      setReach: vi.fn(),
      setContent: vi.fn(),
      reset: vi.fn(),
    }),
  };
});

vi.mock('@/stores/hot/hot.store', async () => {
  const { create } = await import('zustand');
  return {
    useHotStore: create<{
      reach: string;
      timeframe: string;
      setReach: (reach: string) => void;
      setTimeframe: (timeframe: string) => void;
      reset: () => void;
    }>((set) => ({
      reach: 'all',
      timeframe: 'this_month',
      setReach: vi.fn((reach) => set({ reach })),
      setTimeframe: vi.fn((timeframe) => set({ timeframe })),
      reset: vi.fn(() => set({ reach: 'all', timeframe: 'this_month' })),
    })),
  };
});

vi.mock('@/stores/auth/auth.store', async () => {
  const f = await fixtures;
  return {
    useAuthStore: createZustandLikeHook({
      currentUserPubky: f.viewerPubky,
      sessionExport: null,
      hasProfile: true,
      hasHydrated: true,
      isRestoringSession: false,
      selectCurrentUserPubky: () => f.viewerPubky,
    }),
  };
});

vi.mock('@/stores/onboarding/onboarding.store', () => ({
  useOnboardingStore: createZustandLikeHook({
    secretKey: null as string | null,
    showWelcomeDialog: false,
    setShowWelcomeDialog: () => {},
    hasHydrated: true,
  }),
}));

vi.mock('@/stores/migration/migration.store', () => ({
  useMigrationStore: createZustandLikeHook({
    wasDbReset: false,
    setWasDbReset: () => {},
  }),
}));

// MobileFooter (mounted by ContentLayout) pulls notification + local-files
// snapshots; return empty/zero state so the footer renders a neutral chrome.
vi.mock('@/stores/notification/notification.store', () => ({
  useNotificationStore: createZustandLikeHook({
    selectUnread: () => 0,
  }),
}));

vi.mock('@/stores/localFiles/localFiles.store', () => ({
  useLocalFilesStore: createZustandLikeHook({
    profile: null,
    posts: {} as Record<string, never>,
  }),
}));

vi.mock('@/hooks/useKeyboardOffset/useKeyboardOffset', () => ({
  useKeyboardOffset: () => ({ isKeyboardVisible: false, keyboardOffset: 0 }),
}));

vi.mock('@/hooks/usePublicRoute/usePublicRoute', () => ({
  usePublicRoute: () => ({
    isPublicRoute: false,
    isCoreExploreRoute: true,
    isDynamicPublicRoute: false,
    isPublicExploreRoute: true,
  }),
}));

vi.mock('@/hooks/useStreamPagination/useStreamPagination', async () => {
  const f = await fixtures;
  const result = {
    postIds: f.orderedCompositeIds,
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: false,
    loadMore: async () => {},
    refresh: async () => {},
    prependPosts: async () => {},
    removePosts: () => {},
  };
  return { useStreamPagination: vi.fn(() => result) };
});

vi.mock('@/hooks/useUserStream/useUserStream', async () => {
  const f = await fixtures;
  // Compute these once so the mock returns stable references; new array
  // identities on every call cascade into useEffect deps and trigger render
  // loops. Powers HotActiveUsers + WhoToFollowSidebar.
  const usersSnapshot = [...f.whoToFollow];
  const userIdsSnapshot = f.whoToFollow.map((user) => user.id);
  const result = {
    users: usersSnapshot,
    userIds: userIdsSnapshot,
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    error: null,
    loadMore: async () => {},
    refetch: async () => {},
  };
  return { useUserStream: () => result };
});

vi.mock('@/hooks/useMutedUsers/useMutedUsers', () => {
  const result = {
    mutedUserIds: [] as string[],
    mutedUserIdSet: new Set<string>(),
    isMuted: () => false,
    isLoading: false,
  };
  return { useMutedUsers: () => result };
});

vi.mock('@/hooks/useFollowUser/useFollowUser', () => {
  const result = {
    toggleFollow: async () => {},
    isLoading: false,
    loadingAction: null as null,
    loadingUserId: null as null,
    isUserLoading: () => false,
    error: null as string | null,
  };
  return { useFollowUser: () => result };
});

vi.mock('@/hooks/useUnreadPosts/useUnreadPosts', () => {
  const result = { unreadPostIds: [] as string[], unreadCount: 0 };
  return { useUnreadPosts: () => result };
});

vi.mock('@/hooks/usePullToRefresh/usePullToRefresh', () => {
  const result = { state: 'idle' as const, pullDistance: 0 };
  return { usePullToRefresh: () => result };
});

vi.mock('@/hooks/useIsScrolledFromTop/useIsScrolledFromTop', () => ({
  useIsScrolledFromTop: () => false,
}));

vi.mock('@/hooks/usePostDetails/usePostDetails', async () => {
  const f = await fixtures;
  const EMPTY = { postDetails: null, isLoading: false } as const;
  const cache = new Map<string, { postDetails: unknown; isLoading: false }>();
  return {
    usePostDetails: (compositeId: string | null) => {
      if (!compositeId) return EMPTY;
      const cached = cache.get(compositeId);
      if (cached) return cached;
      const fixture = f.postsByCompositeId.get(compositeId);
      if (!fixture) {
        cache.set(compositeId, EMPTY);
        return EMPTY;
      }
      const result = {
        postDetails: { ...fixture.details, is_moderated: false, is_blurred: false },
        isLoading: false as const,
      };
      cache.set(compositeId, result);
      return result;
    },
  };
});

vi.mock('@/hooks/usePostCounts/usePostCounts', async () => {
  const f = await fixtures;
  const ZERO_COUNTS = { tags: 0, unique_tags: 0, replies: 0, reposts: 0 };
  const cache = new Map<string, { postCounts: typeof ZERO_COUNTS; isLoading: false }>();
  return {
    usePostCounts: (compositeId: string) => {
      const cached = cache.get(compositeId);
      if (cached) return cached;
      const fixture = f.postsByCompositeId.get(compositeId);
      const result = { postCounts: fixture?.counts ?? ZERO_COUNTS, isLoading: false as const };
      cache.set(compositeId, result);
      return result;
    },
  };
});

vi.mock('@/hooks/useBookmark/useBookmark', () => {
  const noopToggle = async () => {};
  const result = { isBookmarked: false, isLoading: false, isToggling: false, toggle: noopToggle };
  return { useBookmark: () => result };
});

vi.mock('@/hooks/useUserDetails/useUserDetails', async () => {
  const f = await fixtures;
  const EMPTY = { userDetails: null, isLoading: false } as const;
  const cache = new Map<string, { userDetails: unknown; isLoading: false }>();
  return {
    useUserDetails: (pubky: string | null | undefined) => {
      if (!pubky) return EMPTY;
      const cached = cache.get(pubky);
      if (cached) return cached;
      const profile = f.profiles[pubky] ?? null;
      const result = {
        userDetails: profile ? { ...profile, is_moderated: false, is_blurred: false } : null,
        isLoading: false as const,
      };
      cache.set(pubky, result);
      return result;
    },
  };
});

vi.mock('@/hooks/useAvatarUrl/useAvatarUrl', () => ({
  useAvatarUrl: (userDetails: { image: string | null } | null | undefined) => userDetails?.image ?? null,
}));

vi.mock('@/hooks/useRelativeTime/useRelativeTime', () => {
  const result = { formatRelativeTime: formatStableRelative };
  return { useRelativeTime: () => result };
});

vi.mock('@/hooks/useTtlSubscription/useTtlSubscription', () => {
  const noopRef = () => {};
  const result = { ref: noopRef };
  return { useTtlSubscription: () => result };
});

// Intentionally NOT mocked: the real `useElementHeight` uses ResizeObserver,
// which is available in Chromium. Mocking it with a fixed `height` value
// breaks layout — `PostThreadConnector` consumes that height, and because the
// connector sits in a flex row with the card under `align-items: stretch`, a
// hardcoded connector height stretches the card to match.

vi.mock('@/hooks/usePostHeaderVisibility/usePostHeaderVisibility', async () => {
  const f = await fixtures;
  const cache = new Map<string, { showRepostHeader: boolean; shouldShowPostHeader: boolean }>();
  return {
    usePostHeaderVisibility: (compositeId: string) => {
      const cached = cache.get(compositeId);
      if (cached) return cached;
      const result = {
        showRepostHeader: !!f.postsByCompositeId.get(compositeId)?.relationships.reposted,
        shouldShowPostHeader: true,
      };
      cache.set(compositeId, result);
      return result;
    },
  };
});

vi.mock('@/hooks/useEntityTags/useEntityTags', async () => {
  const f = await fixtures;
  const noopToggle = async () => {};
  const noopAdd = async () => ({ success: true });
  const isViewerTagger = () => false;
  const cache = new Map<string, unknown>();
  return {
    useEntityTags: (taggedId: string) => {
      const cached = cache.get(taggedId);
      if (cached) return cached;
      const fixture = f.postsByCompositeId.get(taggedId);
      const tags = (fixture?.tags ?? []).map((tag) => ({ ...tag, taggers_avatars: [] }));
      const result = {
        tags,
        count: tags.length,
        isLoading: false as const,
        isViewerTagger,
        handleTagToggle: noopToggle,
        handleTagAdd: noopAdd,
      };
      cache.set(taggedId, result);
      return result;
    },
  };
});

vi.mock('@/hooks/usePostTaggers/usePostTaggers', () => {
  const result = {
    taggersByLabel: new Map<string, string[]>(),
    taggerStates: new Map<string, { isLoading: boolean; error: string | null }>(),
    fetchAllTaggers: async () => {},
  };
  return { usePostTaggers: () => result };
});

vi.mock('@/hooks/useThreadReplies/useThreadReplies', () => {
  const result = { replyIds: [] as string[], isLoading: false, hasMore: false, loadMore: async () => {} };
  return { useThreadReplies: () => result };
});

vi.mock('@/hooks/useAuthStatus/useAuthStatus', async () => {
  const types =
    (await import('@/hooks/useAuthStatus/useAuthStatus.types')) as typeof import('@/hooks/useAuthStatus/useAuthStatus.types');
  const result = {
    status: types.AuthStatus.AUTHENTICATED,
    isLoading: false,
    hasKeypair: true,
    hasProfile: true,
    isFullyAuthenticated: true,
  };
  return { useAuthStatus: () => result };
});

vi.mock('@/hooks/useCurrentUserProfile/useCurrentUserProfile', async () => {
  const f = await fixtures;
  const result = {
    userDetails: f.profiles[f.viewerPubky],
    currentUserPubky: f.viewerPubky,
    isLoading: false,
  };
  return { useCurrentUserProfile: () => result };
});

vi.mock('@/hooks/useCustomFeed/useCustomFeed', () => {
  const result = { feed: null, isLoading: false };
  return { useCustomFeed: () => result };
});

// Arena topics and the header SearchInput share the existing Hot tag hook.
vi.mock('@/hooks/useHotTags/useHotTags', async () => {
  const f = await fixtures;
  const result = {
    tags: f.hotTags,
    rawTags: f.rawHotTags.slice(0, 10),
    isLoading: false,
    error: null,
    refetch: async () => {},
  };
  return { useHotTags: vi.fn(() => result) };
});

// Arena nodes resolve native avatars through this hook; keep names stable
// from profile fixtures and skip IndexedDB/CDN avatar fetches.
vi.mock('@/hooks/useBulkUserAvatars/useBulkUserAvatars', async () => {
  const f = await fixtures;
  return {
    useBulkUserAvatars: () => ({
      usersMap: new Map(Object.entries(f.profiles).map(([id, profile]) => [id, { id, name: profile.name }])),
      getUsersWithAvatars: (ids: string[]) =>
        ids.map((id) => ({
          id,
          name: f.profiles[id as keyof typeof f.profiles]?.name,
          avatarUrl: undefined,
        })),
      isLoading: false,
    }),
  };
});

vi.mock('@/hooks/useSearchAutocomplete/useSearchAutocomplete', () => {
  const result = { tags: [], users: [], isLoading: false, error: null };
  return { useSearchAutocomplete: () => result };
});

vi.mock('@/hooks/useRequireAuth/useRequireAuth', () => ({
  useRequireAuth: () => ({
    requireAuth: (action: () => void) => action(),
    isAuthenticated: true,
  }),
}));

vi.mock('@/application/feed/feed', async () => {
  const f = await fixtures;
  return { FeedApplication: f.mockFeedApplication };
});

vi.mock('@/controllers/file/file', () => ({
  FileController: {
    getAvatarUrl: (userDetails: { image: string | null } | null | undefined) => userDetails?.image ?? null,
  },
}));

// The root layout mounts Header above Hot's page-specific ContentLayout.
function HotWithHeader() {
  return (
    <>
      <Header />
      <Hot />
    </>
  );
}

function expectContendersToFit() {
  const floor = document.querySelector('[aria-label="Idea standings"]') as HTMLElement;
  const bounds = floor.getBoundingClientRect();
  const cards = [...floor.querySelectorAll('li > [data-slot="card"]')].map((node) => node.getBoundingClientRect());
  // Engines round fractional grid tracks differently, by much less than a pixel.
  const tolerance = 0.5;
  // The cluster deliberately overlaps cards, with #1 above its neighbors.
  for (const card of cards) {
    expect(card.left).toBeGreaterThanOrEqual(bounds.left - tolerance);
    expect(card.right).toBeLessThanOrEqual(bounds.right + tolerance);
    expect(card.bottom).toBeLessThanOrEqual(bounds.bottom + tolerance);
  }
}

describe('Hot — visual regression', () => {
  it('maps My network to WoT for both topics and idea candidates', async () => {
    const { useHotStore } = await import('@/stores/hot/hot.store');
    const { useHotTags } = await import('@/hooks/useHotTags/useHotTags');
    const { useStreamPagination } = await import('@/hooks/useStreamPagination/useStreamPagination');
    const hotState = useHotStore.getState();
    const previousReach = hotState.reach;
    useHotStore.setState({ reach: 'network' });
    vi.mocked(useHotTags).mockClear();
    vi.mocked(useStreamPagination).mockClear();
    try {
      await renderForVRT(<HotWithHeader />, { viewport: VRT_VIEWPORT_DESKTOP });
      await expect.element(page.getByRole('button', { name: 'Reach: My network', exact: true })).toBeVisible();
      expect(useHotTags).toHaveBeenCalledWith(expect.objectContaining({ reach: 'wot' }));
      expect(useStreamPagination).toHaveBeenCalledWith(expect.objectContaining({ streamId: 'timeline:wot:all:pubky' }));
    } finally {
      useHotStore.setState({ reach: previousReach });
    }
  });

  it('applies one timeframe to topics and posts while preserving the view', async () => {
    const { useHotStore } = await import('@/stores/hot/hot.store');
    const { useHotTags } = await import('@/hooks/useHotTags/useHotTags');
    const { useStreamPagination } = await import('@/hooks/useStreamPagination/useStreamPagination');
    const previousTimeframe = useHotStore.getState().timeframe;
    try {
      await renderForVRT(<HotWithHeader />, { viewport: VRT_VIEWPORT_DESKTOP });
      await expect.element(page.getByRole('button', { name: 'Ranking: Most popular', exact: true })).toBeVisible();
      expect(document.querySelector('[aria-label="Arena filters"] a')).toBeNull();
      expect(
        [...document.querySelectorAll('[aria-label="Arena filters"] button')].map((button) =>
          button.getAttribute('aria-label'),
        ),
      ).toEqual([
        'Ranking: Most popular',
        'Choose topic tag',
        'Content: Content',
        'Timeframe: This month',
        'Reach: All',
        'View: Arena',
      ]);
      await page.getByRole('button', { name: 'Timeframe: This month', exact: true }).click();
      await expect
        .element(page.getByRole('menuitem', { name: 'This month', exact: true }))
        .toHaveAttribute('aria-current', 'true');
      await matchVrtFrameScreenshot('hot-post-window-menu');
      vi.mocked(useHotTags).mockClear();
      vi.mocked(useStreamPagination).mockClear();
      await page.getByRole('menuitem', { name: 'Today', exact: true }).click();
      await expect.element(page.getByRole('button', { name: 'Timeframe: Today', exact: true })).toBeVisible();
      expect(useHotTags).toHaveBeenCalledWith(expect.objectContaining({ timeframe: 'today' }));
      expect(useStreamPagination).toHaveBeenCalledWith(expect.objectContaining({ streamId: 'timeline:all:all:pubky' }));
      await page.getByRole('button', { name: 'View: Arena', exact: true }).click();
      await page.getByRole('menuitem', { name: 'List', exact: true }).click();
      await expect.element(page.getByRole('button', { name: 'View: List', exact: true })).toBeVisible();
      await expect.element(page.getByRole('button', { name: 'Timeframe: Today', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Timeframe: Today', exact: true }).click();
      vi.mocked(useHotTags).mockClear();
      vi.mocked(useStreamPagination).mockClear();
      await page.getByRole('menuitem', { name: 'All time', exact: true }).click();
      expect(useHotTags).toHaveBeenCalledWith(expect.objectContaining({ timeframe: 'all_time' }));
      expect(useStreamPagination).toHaveBeenCalledWith(
        expect.objectContaining({ streamId: 'total_engagement:all:all:pubky' }),
      );
      await page.getByRole('button', { name: 'Ranking: Most popular', exact: true }).click();
      await expect
        .element(page.getByRole('menuitem', { name: 'Most popular', exact: true }))
        .toHaveAttribute('aria-current', 'true');
      expect([...document.querySelectorAll('[role="menuitem"]')].map((item) => item.textContent)).toEqual([
        'Most popular',
        'Most replied',
        'Most tagged',
        'Most reposted',
        'Newest',
      ]);
      expect(document.querySelector('[role="menu"] [role="separator"]')).toBeNull();
      await page.getByRole('menuitem', { name: 'Most reposted', exact: true }).click();
      await expect.element(page.getByRole('button', { name: 'Ranking: Most reposted', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Ranking: Most reposted', exact: true }).click();
      vi.mocked(useStreamPagination).mockClear();
      await page.getByRole('menuitem', { name: 'Newest', exact: true }).click();
      expect(useStreamPagination).toHaveBeenCalledWith(expect.objectContaining({ streamId: 'timeline:all:all:pubky' }));
      await expect.element(page.getByRole('button', { name: 'Ranking: Newest', exact: true })).toBeVisible();
      expect(document.querySelector('[aria-label="Idea standings"] [aria-label="Leading"]')).toBeNull();
    } finally {
      useHotStore.setState({ timeframe: previousTimeframe });
    }
  });

  it('renders Arena at desktop viewport', async () => {
    await renderForVRT(<HotWithHeader />, { viewport: VRT_VIEWPORT_DESKTOP });
    expectContendersToFit();
    await matchVrtFrameScreenshot('hot-desktop');
  });

  it('renders Arena at mobile viewport', async () => {
    await renderForVRT(<HotWithHeader />, { viewport: VRT_VIEWPORT_MOBILE });
    expectContendersToFit();
    await matchVrtFrameScreenshot('hot-mobile');
    await page.getByRole('button', { name: 'Timeframe: This month', exact: true }).click();
    await matchVrtFrameScreenshot('hot-mobile-menu');
  });

  it.each([375, 900, 1024])('keeps cards and controls inside the %ipx viewport', async (width) => {
    await renderForVRT(<HotWithHeader />, { viewport: { width, height: 1000 } });
    expectContendersToFit();
    const floor = document.querySelector('[aria-label="Idea standings"]') as HTMLElement;
    const cards = [...floor.querySelectorAll('li > [data-slot="card"]')];
    const controls = [...document.querySelectorAll('[aria-label="Arena filters"] button')];
    for (const node of [...cards, ...controls]) {
      const bounds = node.getBoundingClientRect();
      expect(bounds.left).toBeGreaterThanOrEqual(-0.5);
      expect(bounds.right).toBeLessThanOrEqual(width + 0.5);
    }
    if (width <= 900) {
      for (const card of cards) {
        expect(getComputedStyle(card).transform).toBe('none');
        expect(card.getBoundingClientRect().width).toBeGreaterThan(250);
      }
    }
  });

  it('renders the leading reply and native thread link', async () => {
    await renderForVRT(<HotWithHeader />, { viewport: VRT_VIEWPORT_DESKTOP });
    await page.getByRole('button', { name: /Rank \d+, .*Hot take: a feed reads better/ }).click();
    await expect.element(page.getByRole('heading', { name: 'LEADING REPLY', exact: true })).toBeVisible();
    await expect
      .element(page.getByRole('region', { name: 'Replies', exact: true }))
      .toHaveTextContent('@bran disagree — putting them under the author keeps reading flow uninterrupted on mobile.');
    const f = await fixtures;
    const reply = [...f.postsByCompositeId.values()].find((post) => post.relationships.replied);
    const rootId = f.compositeIdByUri.get(reply!.relationships.replied!);
    await expect
      .element(page.getByRole('link', { name: /^Show all \d+ replies$/ }))
      .toHaveAttribute('href', `/post/${rootId!.replace(':', '/')}`);
  });

  it('keeps every tablet contender and its stats above the conversation', async () => {
    await renderForVRT(<HotWithHeader />, { viewport: { width: 768, height: 1024 } });
    expectContendersToFit();
    const floor = document.querySelector('[aria-label="Idea standings"]') as HTMLElement;
    const contenders = [...floor.querySelectorAll('li')];
    const reader = document.querySelector('[aria-label="Original post"]') as HTMLElement;
    expect(contenders).toHaveLength(10);
    expect(Math.max(...contenders.map((node) => node.getBoundingClientRect().bottom))).toBeLessThan(
      reader.getBoundingClientRect().top,
    );
    await matchVrtFrameScreenshot('hot-tablet');
  });

  it('keeps a selected side contender clear of the topic tags', async () => {
    await renderForVRT(<HotWithHeader />, { viewport: { width: 1487, height: 1058 } });
    const contender = document.querySelector('[data-position="2"] button') as HTMLElement;
    await page.elementLocator(contender).click();
    expect(contender.getAttribute('aria-pressed')).toBe('true');
    const topic = document.querySelector('[aria-label="Topic standings"] > :nth-child(9)') as HTMLElement;
    expect(contender.getBoundingClientRect().left).toBeGreaterThan(topic.getBoundingClientRect().right);
    await matchVrtFrameScreenshot('hot-selected-side');
  });
});

// Arena reads the same deterministic persisted-post fixture boundary as the native cards.
vi.mock('@/hooks/useArenaIdeas/useArenaIdeas', async () => {
  const f = await fixtures;
  return {
    useArenaIdeas: (ids: string[]) => ({
      ideas: ids.flatMap((id) => {
        const post = f.postsByCompositeId.get(id);
        return post
          ? [
              {
                id,
                author: post.details.author,
                preview: post.details.content,
                kind: post.details.kind,
                indexedAt: post.details.indexed_at,
                tags: post.counts.tags,
                replies: post.counts.replies,
                reposts: post.counts.reposts,
                replyTo: post.relationships.replied
                  ? (f.compositeIdByUri.get(post.relationships.replied) ?? null)
                  : null,
              },
            ]
          : [];
      }),
      error: null,
    }),
  };
});
