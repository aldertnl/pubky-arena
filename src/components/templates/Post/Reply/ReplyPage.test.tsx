import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnrichedPostDetails } from '@/application/moderation/moderation.types';
import { TooltipProvider } from '@/atoms/Tooltip/Tooltip';
import { PostController } from '@/controllers/post/post';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile/useCurrentUserProfile';
import { usePostDetails } from '@/hooks/usePostDetails/usePostDetails';
import { useTtlSubscription } from '@/hooks/useTtlSubscription/useTtlSubscription';
import { useUserDetails } from '@/hooks/useUserDetails/useUserDetails';
import { useToast } from '@/molecules/Toaster/use-toast';
import { useAuthStore } from '@/stores/auth/auth.store';
import { mockAuthStore } from '@/test-utils/stores';
import { asOpaque } from '@/test-utils/type-assertions';
import { resetViewport, setMobileViewport } from '@/test-utils/viewport';
import { ReplyPage } from './ReplyPage';

const AUTHOR_PUBKY = 'o1gg96ewuojmopcjbz8895478wdtxtzzber7aezq6ror5a91j7dy';
const PARENT_POST_ID = `${AUTHOR_PUBKY}:post-id`;
const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();
const mockSetShowSignInDialog = vi.fn();
const mockToast = vi.fn();
const mockUseDialogKeyboardOrchestrator = vi.hoisted(() =>
  vi.fn((..._args: unknown[]) => ({ contentStyle: {}, spacerHeight: 0 })),
);
const mockGetNavigationEntries = vi.fn(() => [
  { name: `${window.location.origin}/post/${AUTHOR_PUBKY}/post-id/reply` },
]);

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
  usePathname: () => `/post/${AUTHOR_PUBKY}/post-id/reply`,
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
}));

vi.mock('@/hooks/useCurrentUserProfile/useCurrentUserProfile', () => ({
  useCurrentUserProfile: vi.fn(),
}));

vi.mock('@/hooks/useDialogKeyboardOrchestrator/useDialogKeyboardOrchestrator', () => ({
  useDialogKeyboardOrchestrator: (...args: unknown[]) => mockUseDialogKeyboardOrchestrator(...args),
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

function renderReplyPage(ui: ReactElement = <ReplyPage postId={PARENT_POST_ID} />) {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
}

function setupExternalBoundaries() {
  vi.clearAllMocks();
  window.history.replaceState({}, '', `/post/${AUTHOR_PUBKY}/post-id/reply`);
  mockGetNavigationEntries.mockReturnValue([{ name: window.location.href }]);
  Object.defineProperty(window.performance, 'getEntriesByType', {
    configurable: true,
    value: mockGetNavigationEntries,
  });

  vi.mocked(usePostDetails).mockImplementation((postId) => ({
    postDetails: postId ? availablePost : undefined,
    isLoading: false,
  }));
  vi.mocked(useCurrentUserProfile).mockReturnValue(
    asOpaque<ReturnType<typeof useCurrentUserProfile>>({
      currentUserPubky: AUTHOR_PUBKY,
      userDetails: { name: 'Reply author' },
    }),
  );
  vi.mocked(useUserDetails).mockReturnValue(
    asOpaque<ReturnType<typeof useUserDetails>>({
      userDetails: { name: 'Reply author' },
      isLoading: false,
    }),
  );
  vi.mocked(useTtlSubscription).mockReturnValue({ ref: vi.fn(), isVisible: false });
  vi.mocked(useToast).mockReturnValue(asOpaque<ReturnType<typeof useToast>>({ toast: mockToast }));

  const authState = mockAuthStore({
    currentUserPubky: AUTHOR_PUBKY,
    setShowSignInDialog: mockSetShowSignInDialog,
  });
  vi.mocked(useAuthStore).mockImplementation((selector) => selector(authState));
  vi.mocked(useAuthStore).getState = vi.fn(() => authState);
}

describe('ReplyPage', () => {
  beforeEach(() => {
    setupExternalBoundaries();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the full-viewport composer in a real modal dialog that hides background UI', () => {
    renderReplyPage(
      <>
        <button type="button">Background action</button>
        <ReplyPage postId={PARENT_POST_ID} />
      </>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Reply' });
    expect(dialog).toHaveClass('h-dvh', 'w-screen', 'bg-background');
    expect(mockUseDialogKeyboardOrchestrator).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: true }),
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Write a reply...');
    expect(screen.getByText('Background action').closest('[aria-hidden="true"]')).toBeInTheDocument();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it('keeps the draft when the user cancels an explicit Back request', async () => {
    const user = userEvent.setup();
    renderReplyPage();

    const reply = screen.getByRole('textbox');
    await user.type(reply, 'Keep this draft');
    await user.click(screen.getByRole('button', { name: 'Back' }));

    const confirmDialog = screen.getByRole('dialog', { name: 'Do you want to close it?' });
    await user.click(within(confirmDialog).getByRole('button', { name: 'Cancel' }));

    expect(reply).toHaveValue('Keep this draft');
    expect(screen.queryByRole('dialog', { name: 'Do you want to close it?' })).not.toBeInTheDocument();
  });

  it('exits to the parent post after the user confirms discard on a direct entry', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderReplyPage();
    await user.type(screen.getByRole('textbox'), 'Discard this draft');
    await user.click(screen.getByRole('button', { name: 'Back' }));

    const confirmDialog = screen.getByRole('dialog', { name: 'Do you want to close it?' });
    await user.click(within(confirmDialog).getByRole('button', { name: 'Discard' }));
    expect(back).toHaveBeenCalledTimes(1);

    fireEvent.popState(window);

    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith(`/post/${AUTHOR_PUBKY}/post-id`));
  });

  it('asks before discarding a draft through the dialog backdrop', async () => {
    const user = userEvent.setup();
    renderReplyPage();
    await user.type(screen.getByRole('textbox'), 'Unsaved');

    await user.click(document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement);

    expect(await screen.findByRole('dialog', { name: 'Do you want to close it?' })).toBeInTheDocument();
  });

  it('intercepts browser Back when dirty and preserves the draft until confirmation', async () => {
    const user = userEvent.setup();
    renderReplyPage();
    const reply = screen.getByRole('textbox');
    await user.type(reply, 'Unsaved');

    await act(async () => {
      fireEvent.popState(window);
    });

    expect(await screen.findByRole('dialog', { name: 'Do you want to close it?' })).toBeInTheDocument();
    expect(reply).toHaveValue('Unsaved');
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('guards a page reload while a draft exists', async () => {
    const user = userEvent.setup();
    renderReplyPage();
    await user.type(screen.getByRole('textbox'), 'Unsaved');
    const event = new Event('beforeunload', { cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('returns two entries through internal history after a successful reply', async () => {
    mockGetNavigationEntries.mockReturnValue([{ name: `${window.location.origin}/home` }]);
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => undefined);
    vi.spyOn(PostController, 'commitCreate').mockResolvedValue(`${AUTHOR_PUBKY}:reply-id`);
    const user = userEvent.setup();
    renderReplyPage();

    await user.type(screen.getByRole('textbox'), 'Publish this reply');
    await user.click(screen.getByRole('button', { name: 'Reply' }));

    await waitFor(() => expect(go).toHaveBeenCalledWith(-2));
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('falls back to the canonical parent post after a direct-entry reply succeeds', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    vi.spyOn(PostController, 'commitCreate').mockResolvedValue(`${AUTHOR_PUBKY}:reply-id`);
    const user = userEvent.setup();
    renderReplyPage();

    await user.type(screen.getByRole('textbox'), 'Publish this reply');
    await user.click(screen.getByRole('button', { name: 'Reply' }));
    await waitFor(() => expect(back).toHaveBeenCalledTimes(1));

    fireEvent.popState(window);

    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith(`/post/${AUTHOR_PUBKY}/post-id`));
  });
});

describe('ReplyPage - Snapshots', () => {
  beforeEach(() => {
    setupExternalBoundaries();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('matches snapshot for the reply page', () => {
    const { baseElement } = renderReplyPage();
    expect(baseElement).toMatchSnapshot();
  });
});

describe('ReplyPage - Mobile Snapshots', () => {
  beforeEach(() => {
    setupExternalBoundaries();
    setMobileViewport();
  });

  afterEach(() => {
    resetViewport();
    vi.restoreAllMocks();
  });

  it('matches snapshot on mobile viewport', () => {
    const { baseElement } = renderReplyPage();
    expect(baseElement).toMatchSnapshot();
  });
});
