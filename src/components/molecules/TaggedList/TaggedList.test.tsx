import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TagKind } from '@/application/tag/tag.types';
import type { TaggedItemProps, TagWithAvatars } from '@/molecules/TaggedItem/TaggedItem.types';
import { TaggedList } from './TaggedList';

const { mockFetchAllTaggers, mockUseEntityTaggers } = vi.hoisted(() => {
  const fetchAllTaggers = vi.fn();
  return {
    mockFetchAllTaggers: fetchAllTaggers,
    mockUseEntityTaggers: vi.fn(() => ({
      taggersByLabel: new Map<string, string[]>(),
      taggerStates: new Map<string, { isLoading: boolean }>(),
      fetchAllTaggers,
    })),
  };
});

vi.mock('@/hooks/useEntityTaggers/useEntityTaggers', () => ({
  useEntityTaggers: mockUseEntityTaggers,
}));

// Mock TaggedItem
vi.mock('@/molecules/TaggedItem/TaggedItem', () => {
  return {
    TaggedItem: ({ tag, onExpandToggle }: TaggedItemProps) => (
      <div data-testid="tagged-item" onClick={() => onExpandToggle?.(tag.label)}>
        {tag.label}
      </div>
    ),
  };
});

const mockTags: TagWithAvatars[] = [
  {
    label: 'bitcoin',
    taggers: [
      { id: 'user1', avatarUrl: 'https://cdn.example.com/avatar/user1' },
      { id: 'user2', avatarUrl: 'https://cdn.example.com/avatar/user2' },
    ],
    taggers_count: 2,
    relationship: false,
  },
  {
    label: 'satoshi',
    taggers: [{ id: 'user3', avatarUrl: 'https://cdn.example.com/avatar/user3' }],
    taggers_count: 1,
    relationship: false,
  },
];

const mockOnTagToggle = vi.fn();

describe('TaggedList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all tags', () => {
    render(<TaggedList tags={mockTags} onTagToggle={mockOnTagToggle} />);

    expect(screen.getByText('bitcoin')).toBeInTheDocument();
    expect(screen.getByText('satoshi')).toBeInTheDocument();
  });

  it('renders empty list when no tags', () => {
    const { container } = render(<TaggedList tags={[]} onTagToggle={mockOnTagToggle} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.queryByTestId('tagged-item')).not.toBeInTheDocument();
  });

  it('renders correct number of items', () => {
    render(<TaggedList tags={mockTags} onTagToggle={mockOnTagToggle} />);
    const items = screen.getAllByTestId('tagged-item');
    expect(items).toHaveLength(2);
  });

  it('fetches all profile taggers when a profile tag expands', async () => {
    render(
      <TaggedList tags={mockTags} taggedId="profile-pubky" taggedKind={TagKind.USER} onTagToggle={mockOnTagToggle} />,
    );

    fireEvent.click(screen.getByText('bitcoin'));

    await waitFor(() => {
      expect(mockUseEntityTaggers).toHaveBeenCalledWith('profile-pubky', TagKind.USER);
      expect(mockFetchAllTaggers).toHaveBeenCalledWith('bitcoin', ['user1', 'user2'], 2);
    });
  });
});

describe('TaggedList - Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnTagToggle.mockClear();
  });

  it('matches snapshot with tags', () => {
    const { container } = render(<TaggedList tags={mockTags} onTagToggle={mockOnTagToggle} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with empty tags', () => {
    const { container } = render(<TaggedList tags={[]} onTagToggle={mockOnTagToggle} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
