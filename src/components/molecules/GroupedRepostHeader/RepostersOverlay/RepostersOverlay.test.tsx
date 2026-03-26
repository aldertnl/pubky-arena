import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RepostersOverlay } from './RepostersOverlay';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      reposters: 'Reposters',
    };
    return translations[key] || key;
  },
}));

vi.mock('@/hooks', () => ({
  useIsMobile: vi.fn(() => false),
}));

vi.mock('@/molecules', () => ({
  UserExpandedList: ({
    userIds,
    className,
    'data-testid': dataTestId,
  }: {
    userIds: string[];
    className?: string;
    'data-testid'?: string;
  }) => (
    <div data-testid={dataTestId || 'user-expanded-list'} data-count={userIds.length} className={className}>
      User List ({userIds.length} users)
    </div>
  ),
}));

describe('RepostersOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Dialog with title on desktop when open', () => {
    render(<RepostersOverlay reposterPubkys={['user1', 'user2']} open={true} onOpenChangeAction={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Reposters')).toBeInTheDocument();
  });

  it('renders UserExpandedList with reposter IDs', () => {
    render(<RepostersOverlay reposterPubkys={['user1', 'user2', 'user3']} open={true} onOpenChangeAction={vi.fn()} />);

    const list = screen.getByTestId('reposter-expanded-list');
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute('data-count', '3');
  });

  it('does not render dialog content when closed', () => {
    render(<RepostersOverlay reposterPubkys={['user1', 'user2']} open={false} onOpenChangeAction={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders Sheet on mobile when open', async () => {
    const { useIsMobile } = await import('@/hooks');
    vi.mocked(useIsMobile).mockReturnValue(true);

    render(<RepostersOverlay reposterPubkys={['user1', 'user2']} open={true} onOpenChangeAction={vi.fn()} />);

    expect(screen.getByText('Reposters')).toBeInTheDocument();
    expect(screen.getByTestId('reposter-expanded-list')).toBeInTheDocument();
  });

  it('overrides UserExpandedList styles for dialog context', () => {
    render(<RepostersOverlay reposterPubkys={['user1']} open={true} onOpenChangeAction={vi.fn()} />);

    const list = screen.getByTestId('reposter-expanded-list');
    expect(list.className).toContain('border-0');
    expect(list.className).toContain('p-0');
  });
});

describe('RepostersOverlay - Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('matches snapshot when open on desktop', () => {
    const { container } = render(
      <RepostersOverlay reposterPubkys={['user1', 'user2']} open={true} onOpenChangeAction={vi.fn()} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot when closed', () => {
    const { container } = render(
      <RepostersOverlay reposterPubkys={['user1', 'user2']} open={false} onOpenChangeAction={vi.fn()} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot on mobile', async () => {
    const { useIsMobile } = await import('@/hooks');
    vi.mocked(useIsMobile).mockReturnValue(true);

    const { container } = render(
      <RepostersOverlay reposterPubkys={['user1', 'user2']} open={true} onOpenChangeAction={vi.fn()} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
