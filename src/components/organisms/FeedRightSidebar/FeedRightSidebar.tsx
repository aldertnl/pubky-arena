'use client';

import { Pencil, UsersRound } from 'lucide-react';
import { Container } from '@/atoms/Container/Container';
import { FeedSection } from '@/molecules/FeedSection/FeedSection';
import { useAuthStore } from '@/stores/auth/auth.store';
import { ActiveUsers } from '../ActiveUsers/ActiveUsers';
import { FeedbackCard } from '../FeedbackCard/FeedbackCard';
import { HotTags } from '../HotTags/HotTags';
import { WhoToFollowSidebar } from '../WhoToFollowSidebar/WhoToFollowSidebar';

// ============================================================================
// Shared Components
// ============================================================================
/**
 * Shared content for Home feed sidebars - WhoToFollow, ActiveUsers, HotTags, FeedbackCard.
 * Used by both HomeFeedRightSidebar (desktop) and HomeFeedRightDrawer (tablet).
 *
 * With `guestPublicExplore`: logged-out viewers skip WhoToFollow and FeedbackCard
 * (same policy as Hot), but still see ActiveUsers and HotTags.
 */
function HomeFeedContent({ guestPublicExplore = false }: { guestPublicExplore?: boolean }) {
  const isAuthenticated = useAuthStore((state) => Boolean(state.currentUserPubky));
  const hideSignupSidebarBlocks = guestPublicExplore && !isAuthenticated;

  return (
    <>
      {!hideSignupSidebarBlocks && <WhoToFollowSidebar />}
      <ActiveUsers />
      <HotTags />
      {!hideSignupSidebarBlocks && <FeedbackCard />}
    </>
  );
}

export type HomeFeedRightPanelProps = {
  /**
   * When true, anonymous users on this surface (e.g. /search) do not see WhoToFollow or FeedbackCard.
   */
  guestPublicExplore?: boolean;
};

// ============================================================================
// Home Feed Right Sidebar Components
// ============================================================================

/**
 * HomeFeedRightSidebar
 *
 * Right sidebar for Home feed - displays WhoToFollow, ActiveUsers, HotTags, FeedbackCard.
 * Desktop version.
 */
export function HomeFeedRightSidebar({ guestPublicExplore = false }: HomeFeedRightPanelProps) {
  return <HomeFeedContent guestPublicExplore={guestPublicExplore} />;
}

/**
 * HomeFeedRightDrawer
 *
 * Right drawer for Home feed (tablet) - displays WhoToFollow, ActiveUsers, HotTags, FeedbackCard.
 */
export function HomeFeedRightDrawer({ guestPublicExplore = false }: HomeFeedRightPanelProps) {
  return (
    <Container overrideDefaults className="flex flex-col gap-6">
      <HomeFeedContent guestPublicExplore={guestPublicExplore} />
    </Container>
  );
}

/**
 * HomeFeedRightDrawerMobile
 *
 * Right drawer for Home feed (mobile) - displays FeedSection.
 */
export function HomeFeedRightDrawerMobile() {
  return (
    <FeedSection
      feeds={[
        {
          icon: UsersRound,
          label: 'Following',
        },
        {
          icon: Pencil,
          label: 'Based bitcoin',
        },
        {
          icon: Pencil,
          label: 'Mining industry',
        },
      ]}
      showCreateButton={true}
    />
  );
}

// ============================================================================
// Hot Feed Right Sidebar Components
// ============================================================================

function AuthenticatedHotRightContent({ layout }: { layout: 'sidebar' | 'drawer' }) {
  if (layout === 'sidebar') {
    return (
      <>
        <WhoToFollowSidebar />
        <Container overrideDefaults className="sticky top-[100px] self-start">
          <FeedbackCard />
        </Container>
      </>
    );
  }
  return (
    <Container overrideDefaults className="flex flex-col gap-6">
      <WhoToFollowSidebar />
      <FeedbackCard />
    </Container>
  );
}

/**
 * HotFeedRightSidebar
 *
 * Right sidebar for Hot feed — WhoToFollow and FeedbackCard when signed in only.
 * Logged-out /hot avoids login-centric sidebar blocks (public explore).
 */
export function HotFeedRightSidebar() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.currentUserPubky));
  if (!isAuthenticated) return null;
  return <AuthenticatedHotRightContent layout="sidebar" />;
}

/**
 * HotFeedRightDrawer
 *
 * Right drawer for Hot feed (tablet/mobile) — same content policy as sidebar.
 */
export function HotFeedRightDrawer() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.currentUserPubky));
  if (!isAuthenticated) return null;
  return <AuthenticatedHotRightContent layout="drawer" />;
}
