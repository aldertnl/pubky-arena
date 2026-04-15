import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DialogInviteFriend } from './DialogInviteFriend';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => <img src={src} alt={alt} width={width} height={height} className={className} data-testid="next-image" />,
}));

// Mock qrcode.react
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, size }: { value: string; size: number }) => (
    <div data-testid="qr-code" data-value={value} data-size={size} />
  ),
}));

// Use vi.hoisted to define mock functions before vi.mock calls
const { mockCopyToClipboard, mockShareWithFallback } = vi.hoisted(() => ({
  mockCopyToClipboard: vi.fn(),
  mockShareWithFallback: vi.fn(),
}));

// Mock @/hooks
vi.mock('@/hooks', () => ({
  useCopyToClipboard: vi.fn(() => ({
    copyToClipboard: mockCopyToClipboard,
  })),
}));

// Mock @/libs
vi.mock('@/libs', () => ({
  shareWithFallback: mockShareWithFallback,
  Copy: ({ className }: { className?: string }) => <span data-testid="copy-icon" className={className} />,
  Share2: ({ className }: { className?: string }) => <span data-testid="share-icon" className={className} />,
}));

// Mock @/atoms
vi.mock('@/atoms', () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div data-testid="dialog" data-open={open} onClick={() => onOpenChange?.(false)}>
      {open ? children : null}
    </div>
  ),
  DialogContent: ({
    children,
    className,
    hiddenTitle,
  }: {
    children: React.ReactNode;
    className?: string;
    hiddenTitle?: string;
  }) => (
    <div data-testid="dialog-content" className={className} data-hidden-title={hiddenTitle}>
      {children}
    </div>
  ),
  Container: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
    overrideDefaults?: boolean;
  }) => (
    <div data-testid="container" className={className}>
      {children}
    </div>
  ),
  Heading: ({
    children,
    level,
    size,
    className,
  }: {
    children: React.ReactNode;
    level?: number;
    size?: string;
    className?: string;
  }) => (
    <h2 data-testid={`heading-${level}`} data-size={size} className={className}>
      {children}
    </h2>
  ),
  Typography: ({
    children,
    className,
    ...rest
  }: {
    children: React.ReactNode;
    className?: string;
    'data-testid'?: string;
  }) => (
    <p data-testid={rest['data-testid'] || 'typography'} className={className}>
      {children}
    </p>
  ),
  Button: ({
    children,
    onClick,
    variant,
    className,
    ...rest
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    className?: string;
    'data-testid'?: string;
  }) => (
    <button data-testid={rest['data-testid']} onClick={onClick} data-variant={variant} className={className}>
      {children}
    </button>
  ),
}));

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  inviteUrl: 'https://invite.example.com/abc123',
};

describe('DialogInviteFriend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCopyToClipboard.mockResolvedValue(true);
    mockShareWithFallback.mockResolvedValue({ success: true, method: 'native' });
    // Ensure navigator.share is NOT available by default (jsdom doesn't have it)
    if ('share' in navigator) {
      Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true });
    }
  });

  it('renders dialog with title, description, QR code, and invite URL when open', () => {
    render(<DialogInviteFriend {...defaultProps} />);

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    expect(screen.getByText('dialogTitle')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    expect(screen.getByTestId('qr-code')).toHaveAttribute('data-value', defaultProps.inviteUrl);
    expect(screen.getByTestId('next-image')).toBeInTheDocument();
  });

  it('displays the invite URL text', () => {
    render(<DialogInviteFriend {...defaultProps} />);

    expect(screen.getByTestId('invite-url')).toBeInTheDocument();
    expect(screen.getByTestId('invite-url')).toHaveTextContent(defaultProps.inviteUrl);
  });

  it('copy button calls copyToClipboard with the invite URL', () => {
    render(<DialogInviteFriend {...defaultProps} />);

    const copyButton = screen.getByTestId('invite-copy-button');
    fireEvent.click(copyButton);

    expect(mockCopyToClipboard).toHaveBeenCalledWith(defaultProps.inviteUrl);
  });

  it('share button is hidden when navigator.share is not available', () => {
    render(<DialogInviteFriend {...defaultProps} />);

    expect(screen.queryByTestId('invite-share-button')).not.toBeInTheDocument();
  });

  it('share button is shown when navigator.share is available', async () => {
    Object.defineProperty(navigator, 'share', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });

    render(<DialogInviteFriend {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('invite-share-button')).toBeInTheDocument();
    });
  });

  it('share button calls shareWithFallback with correct args', async () => {
    Object.defineProperty(navigator, 'share', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });

    render(<DialogInviteFriend {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('invite-share-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('invite-share-button'));

    await waitFor(() => {
      expect(mockShareWithFallback).toHaveBeenCalledWith(
        {
          title: 'shareTitle',
          text: 'shareText',
          url: defaultProps.inviteUrl,
        },
        {
          onFallback: expect.any(Function),
        },
      );
    });
  });
});

describe('DialogInviteFriend - Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCopyToClipboard.mockResolvedValue(true);
  });

  it('matches snapshot for open dialog', () => {
    const { container } = render(<DialogInviteFriend {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
