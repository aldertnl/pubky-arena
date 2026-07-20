import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnrichedPostDetails } from '@/application/moderation/moderation.types';
import { POST_THREAD_CONNECTOR_VARIANTS } from '@/atoms/PostThreadConnector/PostThreadConnector.constants';
import { TooltipProvider } from '@/atoms/Tooltip/Tooltip';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile/useCurrentUserProfile';
import { usePostDetails } from '@/hooks/usePostDetails/usePostDetails';
import { useTtlSubscription } from '@/hooks/useTtlSubscription/useTtlSubscription';
import { useUserDetails } from '@/hooks/useUserDetails/useUserDetails';
import { useToast } from '@/molecules/Toaster/use-toast';
import { useAuthStore } from '@/stores/auth/auth.store';
import { mockAuthStore } from '@/test-utils/stores';
import { asOpaque } from '@/test-utils/type-assertions';
import { resetViewport, setMobileViewport } from '@/test-utils/viewport';
import { ReplyComposer } from './ReplyComposer';

const AUTHOR_PUBKY = 'o1gg96ewuojmopcjbz8895478wdtxtzzber7aezq6ror5a91j7dy';
const PARENT_POST_ID = `${AUTHOR_PUBKY}:post-id`;
const mockRouterPush = vi.fn();
const mockSetShowSignInDialog = vi.fn();
const mockToast = vi.fn();

const availablePost = asOpaque<EnrichedPostDetails>({
  id: PARENT_POST_ID,
  content: 'A replyable parent post',
  kind: 'short',
  indexed_at: 1_720_000_000_000,
  uri: '',
  attachments: null,
  is_moderated: false,
  is_blurred: false,
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/post/author/post-id/reply',
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('@/hooks/useCurrentUserProfile/useCurrentUserProfile', () => ({
  useCurrentUserProfile: vi.fn(),
}));

vi.mock('@/hooks/usePostDetails/usePostDetails', () => ({
  usePostDetails: vi.fn(),
}));

vi.mock('@/hooks/useTtlSubscription/useTtlSubscription', () => ({
  useTtlSubscription: vi.fn(),
}));

vi.mock('@/hooks/useUserDetails/useUserDetails', () => ({
  useUserDetails: vi.fn(),
}));

vi.mock('@/molecules/Toaster/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/stores/auth/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

function setParentPost(postDetails: EnrichedPostDetails | null | undefined, isLoading = false) {
  vi.mocked(usePostDetails).mockImplementation((postId) => ({
    postDetails: postId ? postDetails : undefined,
    isLoading: Boolean(postId) && isLoading,
  }));
}

function renderPageComposer() {
  return renderComposer(
    <ReplyComposer
      postId={PARENT_POST_ID}
      resetKey={0}
      onSuccess={vi.fn()}
      onContentChange={vi.fn()}
      presentation="page"
    />,
  );
}

function renderComposer(ui: ReactElement) {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
}

function setupExternalBoundaries() {
  vi.clearAllMocks();
  setParentPost(availablePost);
  vi.mocked(useCurrentUserProfile).mockReturnValue({
    currentUserPubky: AUTHOR_PUBKY,
    userDetails: { name: 'Reply author' },
  } as never);
  vi.mocked(useUserDetails).mockReturnValue({
    userDetails: { name: 'Reply author' },
    isLoading: false,
  } as never);
  vi.mocked(useTtlSubscription).mockReturnValue({ ref: vi.fn(), isVisible: false });
  vi.mocked(useToast).mockReturnValue({ toast: mockToast } as never);
  const authState = mockAuthStore({
    currentUserPubky: AUTHOR_PUBKY,
    setShowSignInDialog: mockSetShowSignInDialog,
  });
  vi.mocked(useAuthStore).mockImplementation((selector) => selector(authState));
  vi.mocked(useAuthStore).getState = vi.fn(() => authState);
}

describe('ReplyComposer', () => {
  beforeEach(() => {
    setupExternalBoundaries();
  });

  it('keeps the existing connected preview layout in dialogs', () => {
    const onContentChange = vi.fn();
    const { container } = renderComposer(
      <ReplyComposer postId={PARENT_POST_ID} resetKey={0} onSuccess={vi.fn()} onContentChange={onContentChange} />,
    );

    expect(screen.getByRole('link', { name: 'View original post' })).toBeInTheDocument();
    expect(
      container.querySelector(`[data-variant="${POST_THREAD_CONNECTOR_VARIANTS.DIALOG_REPLY}"]`),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Write a reply...');
  });

  it('bounds and disables the parent preview in page presentation', () => {
    const { container } = renderPageComposer();

    const parentPreview = container.querySelector('[inert]');
    expect(parentPreview).toHaveClass('max-h-40', 'overflow-hidden');
    expect(screen.queryByRole('link', { name: 'View original post' })).not.toBeInTheDocument();
    expect(
      container.querySelector(`[data-variant="${POST_THREAD_CONNECTOR_VARIANTS.DIALOG_REPLY}"]`),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('does not render the reply input while the parent is loading', () => {
    setParentPost(undefined, true);

    renderPageComposer();

    expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it.each([null, asOpaque<EnrichedPostDetails>({ ...availablePost, content: '[DELETED]' })])(
    'does not render the reply input for an unavailable parent',
    (postDetails) => {
      setParentPost(postDetails);

      renderPageComposer();

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    },
  );
});

describe('ReplyComposer - Snapshots', () => {
  beforeEach(() => {
    setupExternalBoundaries();
  });

  it('matches snapshot for the routed page presentation', () => {
    const { container } = renderPageComposer();
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('ReplyComposer - Mobile Snapshots', () => {
  beforeEach(() => {
    setupExternalBoundaries();
    setMobileViewport();
  });

  afterEach(() => {
    resetViewport();
  });

  it('matches snapshot on mobile viewport', () => {
    const { container } = renderPageComposer();
    expect(container.firstChild).toMatchSnapshot();
  });
});
