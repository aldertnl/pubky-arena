import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostHomeserverVerifyIcon } from './PostHomeserverVerifyIcon';

const mockVerify = vi.fn();
const mockUsePostHomeserverVerification = vi.hoisted(() =>
  vi.fn(() => ({
    status: 'idle' as const,
    verify: mockVerify,
    isVerified: false,
  })),
);

vi.mock('@/hooks/usePostHomeserverVerification/usePostHomeserverVerification', () => ({
  usePostHomeserverVerification: mockUsePostHomeserverVerification,
}));

describe('PostHomeserverVerifyIcon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePostHomeserverVerification.mockReturnValue({
      status: 'idle',
      verify: mockVerify,
      isVerified: false,
    });
  });

  it('renders seen double-check icon by default', () => {
    const { container } = render(<PostHomeserverVerifyIcon postId="author:post123" />);

    const icon = container.querySelector('.homeserver-seen');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('text-muted-foreground');
    expect(icon?.querySelectorAll('path')).toHaveLength(2);
  });

  it('calls verify on click and stops propagation', async () => {
    const user = userEvent.setup();
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <PostHomeserverVerifyIcon postId="author:post123" />
      </div>,
    );

    await user.click(screen.getByRole('button'));

    expect(mockVerify).toHaveBeenCalledTimes(1);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('shows brand fill when verified', () => {
    mockUsePostHomeserverVerification.mockReturnValue({
      status: 'verified',
      verify: mockVerify,
      isVerified: true,
    });

    const { container } = render(<PostHomeserverVerifyIcon postId="author:post123" />);

    const icon = container.querySelector('.verify-badge');
    expect(icon).toHaveClass('text-brand');
    const badgePath = icon?.querySelector('path');
    expect(badgePath).toHaveAttribute('fill', 'currentColor');
  });

  it('shows spinner while checking', () => {
    mockUsePostHomeserverVerification.mockReturnValue({
      status: 'checking',
      verify: mockVerify,
      isVerified: false,
    });

    const { container } = render(<PostHomeserverVerifyIcon postId="author:post123" />);

    expect(container.querySelector('.lucide-loader-circle')).toBeInTheDocument();
  });
});
