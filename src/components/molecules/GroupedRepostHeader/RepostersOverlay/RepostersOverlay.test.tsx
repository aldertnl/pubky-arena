import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepostersOverlay } from './RepostersOverlay';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      reposters: 'Reposters',
    };
    return translations[key] || key;
  },
}));

// Mock WhoTaggedExpandedList (tested separately)
vi.mock('@/molecules', () => ({
  WhoTaggedExpandedList: ({
    taggerIds,
    className,
    'data-testid': dataTestId,
  }: {
    taggerIds: string[];
    fallbackTaggers?: Array<{ id: string; name?: string; avatarUrl?: string }>;
    className?: string;
    'data-testid'?: string;
  }) => (
    <div data-testid={dataTestId || 'who-tagged-expanded-list'} data-count={taggerIds.length} className={className}>
      User List ({taggerIds.length} users)
    </div>
  ),
}));

describe('RepostersOverlay', () => {
  const mockReposterIds = ['user1', 'user2', 'user3'];
  const mockFallbackReposters = [
    { id: 'user1', name: 'Alice', avatarUrl: 'https://example.com/alice.jpg' },
    { id: 'user2', name: 'Bob', avatarUrl: 'https://example.com/bob.jpg' },
    { id: 'user3', name: 'Charlie', avatarUrl: 'https://example.com/charlie.jpg' },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    reposterIds: mockReposterIds,
    fallbackReposters: mockFallbackReposters,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dialog variant', () => {
    it('renders dialog with title "Reposters"', () => {
      render(<RepostersOverlay {...defaultProps} variant="dialog" />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Reposters');
    });

    it('renders WhoTaggedExpandedList with full reposterIds', () => {
      render(<RepostersOverlay {...defaultProps} variant="dialog" />);

      const list = screen.getByTestId('reposter-expanded-list');
      expect(list).toBeInTheDocument();
      expect(list).toHaveAttribute('data-count', '3');
    });

    it('shows all reposter IDs even when fallback is partial', () => {
      render(
        <RepostersOverlay
          {...defaultProps}
          variant="dialog"
          reposterIds={['user1', 'user2', 'user3', 'user4', 'user5']}
          fallbackReposters={[mockFallbackReposters[0], mockFallbackReposters[1]]}
        />,
      );

      const list = screen.getByTestId('reposter-expanded-list');
      expect(list).toHaveAttribute('data-count', '5');
    });

    it('passes open state to Dialog', () => {
      const { rerender } = render(<RepostersOverlay {...defaultProps} variant="dialog" open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<RepostersOverlay {...defaultProps} variant="dialog" open={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('calls onOpenChange when dialog close button is clicked', () => {
      const onOpenChange = vi.fn();
      render(<RepostersOverlay {...defaultProps} variant="dialog" onOpenChange={onOpenChange} />);

      fireEvent.click(screen.getByTestId('dialog-close'));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('sheet variant', () => {
    it('renders sheet with title "Reposters"', () => {
      render(<RepostersOverlay {...defaultProps} variant="sheet" />);

      expect(screen.getByText('Reposters')).toBeInTheDocument();
    });

    it('renders with bottom side', () => {
      render(<RepostersOverlay {...defaultProps} variant="sheet" />);

      expect(screen.getByTestId('reposter-expanded-list')).toBeInTheDocument();
    });

    it('renders WhoTaggedExpandedList with reposterIds', () => {
      render(<RepostersOverlay {...defaultProps} variant="sheet" />);

      const list = screen.getByTestId('reposter-expanded-list');
      expect(list).toBeInTheDocument();
      expect(list).toHaveAttribute('data-count', '3');
    });

    it('passes open state to Sheet', () => {
      const { rerender } = render(<RepostersOverlay {...defaultProps} variant="sheet" open={false} />);

      rerender(<RepostersOverlay {...defaultProps} variant="sheet" open={true} />);
      expect(screen.getByTestId('reposter-expanded-list')).toBeInTheDocument();
    });

    it('calls onOpenChange when sheet is closed', () => {
      const onOpenChange = vi.fn();
      render(<RepostersOverlay {...defaultProps} variant="sheet" onOpenChange={onOpenChange} />);

      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('has correct styling classes', () => {
      render(<RepostersOverlay {...defaultProps} variant="sheet" />);

      const content = document.querySelector('.rounded-t-2xl.pb-8');
      expect(content).toBeTruthy();
    });
  });
});

describe('RepostersOverlay - Snapshots', () => {
  const mockReposterIds = ['user1', 'user2'];
  const mockFallbackReposters = [
    { id: 'user1', name: 'Alice', avatarUrl: 'https://example.com/alice.jpg' },
    { id: 'user2', name: 'Bob', avatarUrl: 'https://example.com/bob.jpg' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('matches snapshot for dialog variant when open', () => {
    render(
      <RepostersOverlay
        variant="dialog"
        open={true}
        onOpenChange={vi.fn()}
        reposterIds={mockReposterIds}
        fallbackReposters={mockFallbackReposters}
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toMatchSnapshot();
  });

  it('matches snapshot for dialog variant when closed', () => {
    const { container } = render(
      <RepostersOverlay
        variant="dialog"
        open={false}
        onOpenChange={vi.fn()}
        reposterIds={mockReposterIds}
        fallbackReposters={mockFallbackReposters}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for sheet variant when open', () => {
    render(
      <RepostersOverlay
        variant="sheet"
        open={true}
        onOpenChange={vi.fn()}
        reposterIds={mockReposterIds}
        fallbackReposters={mockFallbackReposters}
      />,
    );
    const list = screen.getByTestId('reposter-expanded-list');
    expect(list.closest('[role="dialog"]')).toMatchSnapshot();
  });

  it('matches snapshot for sheet variant when closed', () => {
    const { container } = render(
      <RepostersOverlay
        variant="sheet"
        open={false}
        onOpenChange={vi.fn()}
        reposterIds={mockReposterIds}
        fallbackReposters={mockFallbackReposters}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
