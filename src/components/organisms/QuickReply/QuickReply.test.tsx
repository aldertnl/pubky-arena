import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST_MAX_CHARACTER_LENGTH } from '@/config/posts';
import { PostMainLayoutProvider } from '@/organisms/PostMain/PostMainLayoutContext';
import { resetViewport, setMobileViewport } from '@/test-utils/viewport';
import { QuickReply } from './QuickReply';

// next-intl is mocked globally in src/config/test.ts
// The global mock uses real translations from messages/en.json

// Real prompts from messages/en.json for test assertions
const REAL_PROMPTS = [
  'What are your thoughts on this?',
  'What do you think?',
  'Do you agree?',
  'Any additional insights?',
  'How would you respond?',
];

const mockUsePostInput = vi.fn();
const mockUseEnterSubmit = vi.fn();
const mockRequireAuth = vi.fn(<T,>(action: () => T) => action());
const mockOpenReply = vi.fn();
let mockIsAuthenticated = true;

function createUsePostInputReturn(options: unknown, overrides: Record<string, unknown> = {}) {
  return {
    textareaRef: { current: null },
    containerRef: { current: null },
    fileInputRef: { current: null },
    content: '',
    tags: [],
    attachments: [],
    setAttachments: vi.fn(),
    isDragging: false,
    isExpanded: false,
    isSubmitting: false,
    showEmojiPicker: false,
    setShowEmojiPicker: vi.fn(),
    hasContent: false,
    displayPlaceholder: (options as { placeholder?: string })?.placeholder,
    currentUserPubky: 'user:me',
    handleExpand: vi.fn(),
    handleSubmit: vi.fn(),
    handleChange: vi.fn(),
    handleEmojiSelect: vi.fn(),
    handleFilesAdded: vi.fn(),
    handleFileClick: vi.fn(),
    handleDragEnter: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDragOver: vi.fn(),
    handleDrop: vi.fn(),
    handlePaste: vi.fn(),
    setTags: vi.fn(),
    ...overrides,
  };
}

vi.mock('@/atoms/Container/Container', () => {
  return {
    Container: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <div data-testid="container" {...props}>
        {children}
      </div>
    ),
  };
});

vi.mock('@/atoms/PostThreadConnector/PostThreadConnector', () => {
  return {
    PostThreadConnector: ({ ...props }: { [key: string]: unknown }) => (
      <div data-testid="thread-connector" {...props} />
    ),
  };
});

vi.mock('@/atoms/PostThreadConnector/PostThreadConnector.constants', () => {
  return {
    POST_THREAD_CONNECTOR_VARIANTS: { LAST: 'last', REGULAR: 'regular', DIALOG_REPLY: 'dialog-reply' },
  };
});

vi.mock('@/atoms/Textarea/Textarea', () => {
  return {
    Textarea: ({ 'data-testid': dataTestId, ...props }: { 'data-testid'?: string; [key: string]: unknown }) => (
      <textarea data-testid={dataTestId ?? 'textarea'} {...props} />
    ),
  };
});

vi.mock('@/organisms/AvatarWithFallback/AvatarWithFallback', () => {
  return {
    AvatarWithFallback: ({ size }: { size?: string }) => <div data-testid="avatar" data-size={size} />,
  };
});

vi.mock('@/molecules/EmojiPickerDialog/EmojiPickerDialog', () => {
  return {
    EmojiPickerDialog: ({ ...props }: { [key: string]: unknown }) => <div data-testid="emoji-dialog" {...props} />,
  };
});

vi.mock('@/molecules/PostLinkEmbeds/PostLinkEmbeds', () => {
  return {
    PostLinkEmbeds: ({ ...props }: { [key: string]: unknown }) => <div data-testid="link-embeds" {...props} />,
  };
});

vi.mock('@/molecules/PostTag/PostTag', () => {
  return {
    PostTag: ({ label }: { label: string }) => <div data-testid="tag">{label}</div>,
  };
});

vi.mock('@/molecules/PostInputAttachments/PostInputAttachments', () => ({
  PostInputAttachments: ({ ...props }: { [key: string]: unknown }) => (
    <div data-testid="post-input-attachments" {...props} />
  ),
}));

vi.mock('@/organisms/PostInputActionBar/PostInputActionBar', () => ({
  PostInputActionBar: ({ ...props }: { [key: string]: unknown }) => <div data-testid="action-bar" {...props} />,
}));

vi.mock('@/organisms/PostInputTags/PostInputTags', () => ({
  PostInputTags: ({ ...props }: { [key: string]: unknown }) => <div data-testid="tags-input" {...props} />,
}));

vi.mock('@/organisms/PostInputExpandableSection/PostInputExpandableSection', () => ({
  PostInputExpandableSection: ({
    characterLimit,
    isDisabled,
    isPostDisabled,
    onSubmit,
    onImageClick,
  }: {
    characterLimit?: {
      count: number;
      max: number;
    };
    isDisabled?: boolean;
    isPostDisabled?: boolean;
    onSubmit?: () => void | Promise<void>;
    onImageClick?: () => void;
  }) => (
    <div
      data-testid="post-input-expandable-section"
      data-character-count={characterLimit?.count}
      data-character-max={characterLimit?.max}
      data-disabled={String(isDisabled)}
      data-post-disabled={String(isPostDisabled)}
    >
      <button data-testid="quick-reply-submit" onClick={() => onSubmit?.()}>
        Submit
      </button>
      <button data-testid="quick-reply-image" onClick={() => onImageClick?.()}>
        Image
      </button>
    </div>
  ),
}));

vi.mock('@/hooks/useCurrentUserProfile/useCurrentUserProfile', () => ({
  useCurrentUserProfile: () => ({ currentUserPubky: 'user:me' }),
}));

vi.mock('@/hooks/useUserDetails/useUserDetails', () => ({
  useUserDetails: () => ({ userDetails: { name: 'Me' } }),
}));

vi.mock('@/hooks/useAvatarUrl/useAvatarUrl', () => ({
  useAvatarUrl: () => 'https://example.com/avatar.png',
}));

vi.mock('@/hooks/useElementHeight/useElementHeight', () => ({
  useElementHeight: () => ({ ref: () => null, height: 123 }),
}));

vi.mock('@/hooks/useEnterSubmit/useEnterSubmit', () => ({
  useEnterSubmit: (...args: unknown[]) => mockUseEnterSubmit(...args),
}));

vi.mock('@/hooks/usePostInput/usePostInput', () => ({
  usePostInput: (options: unknown) => mockUsePostInput(options),
}));

vi.mock('@/hooks/useRequireAuth/useRequireAuth', () => ({
  useRequireAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    requireAuth: mockRequireAuth,
  }),
}));

vi.mock('@/hooks/usePostReplyAction/usePostReplyAction', () => ({
  usePostReplyAction: () => ({ openReply: mockOpenReply }),
}));

describe('QuickReply', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockIsAuthenticated = true;
    mockRequireAuth.mockImplementation(<T,>(action: () => T) => action());
    mockUseEnterSubmit.mockReturnValue(() => undefined);
    mockUsePostInput.mockImplementation((options: unknown) => createUsePostInputReturn(options));
  });

  afterEach(() => {
    resetViewport();
  });

  it('uses the same deterministic prompt for the CTA and mounted editor', () => {
    render(<QuickReply parentPostId="author:post1" />);

    const placeholder = screen.getByTestId('quick-reply-textarea').getAttribute('placeholder');

    expect(REAL_PROMPTS).toContain(placeholder);
    expect(screen.getByTestId('quick-reply-mobile-cta')).toHaveTextContent(placeholder!);
  });

  it('forwards clipboard paste to usePostInput handlePaste (image attachments)', () => {
    const handlePaste = vi.fn();
    mockUsePostInput.mockImplementation((options: unknown) => createUsePostInputReturn(options, { handlePaste }));

    render(<QuickReply parentPostId="author:post1" />);

    fireEvent.paste(screen.getByTestId('quick-reply-textarea'));

    expect(handlePaste).toHaveBeenCalledTimes(1);
  });

  it('opens sign-in and does not mutate content when an anonymous user types', () => {
    mockIsAuthenticated = false;
    mockRequireAuth.mockReturnValue(undefined);
    const handleChange = vi.fn();
    mockUsePostInput.mockImplementation((options: unknown) => createUsePostInputReturn(options, { handleChange }));

    render(<QuickReply parentPostId="author:post1" />);

    const textarea = screen.getByTestId('quick-reply-textarea');
    fireEvent.change(textarea, { target: { value: 'anonymous reply' } });

    expect(mockRequireAuth).toHaveBeenCalled();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('opens sign-in and does not submit when an anonymous user clicks submit', () => {
    mockIsAuthenticated = false;
    mockRequireAuth.mockReturnValue(undefined);
    const handleSubmit = vi.fn();
    mockUsePostInput.mockImplementation((options: unknown) => createUsePostInputReturn(options, { handleSubmit }));

    render(<QuickReply parentPostId="author:post1" />);

    fireEvent.click(screen.getByTestId('quick-reply-submit'));

    expect(mockRequireAuth).toHaveBeenCalled();
    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('post-input-expandable-section')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByTestId('post-input-expandable-section')).toHaveAttribute('data-post-disabled', 'false');
  });

  it('opens sign-in and does not attach files when an anonymous user drops files', () => {
    mockIsAuthenticated = false;
    mockRequireAuth.mockReturnValue(undefined);
    const handleDrop = vi.fn();
    mockUsePostInput.mockImplementation((options: unknown) => createUsePostInputReturn(options, { handleDrop }));

    render(<QuickReply parentPostId="author:post1" />);

    const inputContainer = screen.getAllByTestId('container').find((c) => c.className?.includes('rounded-md'));
    fireEvent.drop(inputContainer!, {
      dataTransfer: {
        files: [new File(['avatar'], 'avatar.png', { type: 'image/png' })],
        items: [],
        types: ['Files'],
      },
    });

    expect(mockRequireAuth).toHaveBeenCalled();
    expect(handleDrop).not.toHaveBeenCalled();
  });

  it('keeps the prompt stable across mounts for the same post', () => {
    render(<QuickReply parentPostId="author:post1" />);
    const firstPrompt = screen.getByTestId('quick-reply-textarea').getAttribute('placeholder');

    cleanup();
    render(<QuickReply parentPostId="author:post1" />);

    expect(screen.getByTestId('quick-reply-textarea')).toHaveAttribute('placeholder', firstPrompt);
  });

  it('passes characterLimit to expandable section for reply mode', () => {
    mockUsePostInput.mockImplementation((options: unknown) =>
      createUsePostInputReturn(options, {
        content: 'Reply text',
      }),
    );

    render(<QuickReply parentPostId="author:post1" />);

    const expandableSection = screen.getByTestId('post-input-expandable-section');
    expect(expandableSection).toHaveAttribute('data-character-count', '10');
    expect(expandableSection).toHaveAttribute('data-character-max', POST_MAX_CHARACTER_LENGTH.toString());
  });

  describe('wide layout', () => {
    it('uses inline padding, default avatar size, and no body class when no provider is present', () => {
      render(<QuickReply parentPostId="author:post1" />);

      const inputContainer = screen.getAllByTestId('container').find((c) => c.className?.includes('rounded-md'));
      expect(inputContainer?.className).toContain('p-4');
      expect(inputContainer?.className).not.toContain('p-12');

      expect(screen.getAllByTestId('avatar').at(-1)).toHaveAttribute('data-size', 'default');
      expect(screen.getByTestId('quick-reply-textarea')).not.toHaveAttribute('class');
    });

    it('applies wide padding, xl avatar, and text-xl body when inheriting side layout', () => {
      render(
        <PostMainLayoutProvider tagsLayout="side">
          <QuickReply parentPostId="author:post1" />
        </PostMainLayoutProvider>,
      );

      const inputContainer = screen.getAllByTestId('container').find((c) => c.className?.includes('rounded-md'));
      expect(inputContainer?.className).toContain('p-12');
      expect(inputContainer?.className).not.toContain('p-4');

      expect(screen.getAllByTestId('avatar').at(-1)).toHaveAttribute('data-size', 'xl');
      expect(screen.getByTestId('quick-reply-textarea')).toHaveAttribute('class', 'text-xl leading-7');
    });

    it('uses CSS to show the CTA and hide the inactive editor below lg', () => {
      render(
        <PostMainLayoutProvider tagsLayout="side">
          <QuickReply parentPostId="author:post1" />
        </PostMainLayoutProvider>,
      );

      expect(screen.getByTestId('quick-reply-mobile-cta')).toBeInTheDocument();
      expect(screen.getByTestId('quick-reply-mobile')).toHaveClass('flex', 'lg:hidden');
      expect(screen.getByTestId('quick-reply-desktop')).toHaveClass('hidden', 'lg:flex');
      expect(screen.getByTestId('quick-reply-textarea')).toBeInTheDocument();
      expect(mockUsePostInput).toHaveBeenCalledWith(expect.objectContaining({ expanded: false }));
    });

    it('opens the route-based composer from the mobile CTA', () => {
      render(<QuickReply parentPostId="author:post1" />);

      fireEvent.click(screen.getByTestId('quick-reply-mobile-cta'));

      expect(mockRequireAuth).toHaveBeenCalledTimes(1);
      expect(mockOpenReply).toHaveBeenCalledTimes(1);
    });
  });

  it.each([
    ['text', { content: 'Unsubmitted reply', isExpanded: true }],
    ['tags', { tags: ['pubky'], isExpanded: true }],
    ['attachments', { attachments: [new File(['image'], 'reply.png', { type: 'image/png' })], isExpanded: true }],
  ])('keeps an active desktop %s draft mounted and usable across the lg breakpoint', (_kind, overrides) => {
    mockUsePostInput.mockImplementation((options: unknown) => createUsePostInputReturn(options, overrides));
    const { rerender } = render(<QuickReply parentPostId="author:post1" />);
    const textarea = screen.getByTestId('quick-reply-textarea');

    setMobileViewport();
    fireEvent(window, new Event('resize'));
    rerender(<QuickReply parentPostId="author:post1" />);

    expect(screen.getByTestId('quick-reply-textarea')).toBe(textarea);
    expect(screen.getByTestId('quick-reply-desktop')).toHaveClass('flex');
    expect(screen.getByTestId('quick-reply-desktop')).not.toHaveClass('hidden');
    expect(screen.getByTestId('quick-reply-mobile')).toHaveClass('hidden');
  });

  it('hydrates the same QuickReply tree on a mobile client without a recoverable mismatch', async () => {
    const element = <QuickReply parentPostId="author:post1" />;
    vi.stubGlobal('window', undefined);
    let serverMarkup: string;
    try {
      serverMarkup = renderToString(element);
    } finally {
      vi.unstubAllGlobals();
    }
    const container = document.createElement('div');
    container.innerHTML = serverMarkup;
    setMobileViewport();
    const onRecoverableError = vi.fn();

    const root = hydrateRoot(container, element, { onRecoverableError });
    await act(async () => undefined);

    expect(onRecoverableError).not.toHaveBeenCalled();
    await act(async () => root.unmount());
  });
});

describe('QuickReply - Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockRequireAuth.mockImplementation(<T,>(action: () => T) => action());
    mockUseEnterSubmit.mockReturnValue(() => undefined);
    mockUsePostInput.mockImplementation((options: unknown) => createUsePostInputReturn(options));
  });

  it('matches snapshot with default props', () => {
    const { container } = render(
      <PostMainLayoutProvider tagsLayout="side">
        <QuickReply parentPostId="author:post1" />
      </PostMainLayoutProvider>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
