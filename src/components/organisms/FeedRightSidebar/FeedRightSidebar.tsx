'use client';
// ============================================================================
// Shared Components
// ============================================================================
/**
 * HomeFeedContent
 *
 * Shared content for Home feed sidebars - WhoToFollow, ActiveUsers, HotTags, FeedbackCard.
 * Used by both HomeFeedRightSidebar (desktop) and HomeFeedRightDrawer (tablet).
 */
import { Pencil, UsersRound } from 'lucide-react';
import { Container } from '@/atoms/Container/Container';
import { FeedSection } from '@/molecules/FeedSection/FeedSection';
import { useAuthStore } from '@/stores/auth/auth.store';
import { ActiveUsers } from '../ActiveUsers/ActiveUsers';
import { FeedbackCard } from '../FeedbackCard/FeedbackCard';
import { HotTags } from '../HotTags/HotTags';
import { WhoToFollowSidebar } from '../WhoToFollowSidebar/WhoToFollowSidebar';

function HomeFeedContent() {
  return (
    <>
      <WhoToFollowSidebar />
      <ActiveUsers />
      <HotTags />
      <FeedbackCard />
    </>
  );
}

// ============================================================================
// Home Feed Right Sidebar Components
// ============================================================================

/**
 * HomeFeedRightSidebar
 *
 * Right sidebar for Home feed - displays WhoToFollow, ActiveUsers, HotTags, FeedbackCard.
 * Desktop version.
 */
export function HomeFeedRightSidebar() {
  return <HomeFeedContent />;
}

/**
 * HomeFeedRightDrawer
 *
 * Right drawer for Home feed (tablet) - displays WhoToFollow, ActiveUsers, HotTags, FeedbackCard.
 */
export function HomeFeedRightDrawer() {
  return (
    <Container overrideDefaults className="flex flex-col gap-6">
      <HomeFeedContent />
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
