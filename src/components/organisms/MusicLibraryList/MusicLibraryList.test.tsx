import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseMusicAlbumCover } = vi.hoisted(() => ({
  mockUseMusicAlbumCover: vi.fn(),
}));

vi.mock('@/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/hooks')>('@/hooks');

  return {
    ...actual,
    useMusicAlbumCover: mockUseMusicAlbumCover,
  };
});

import { MusicLibraryList } from './MusicLibraryList';

const items = [
  {
    id: 'item-1',
    artist: 'Burial',
    album: 'Untrue',
    track: 'Archangel',
    year: '2007',
    genre: 'UK Garage',
    rating: '5',
    createdAt: '2026-04-14T00:00:00.000Z',
  },
];

const artistOnlyItems = [
  {
    id: 'item-2',
    artist: 'Burial',
    album: '',
    track: 'Ghost Hardware',
    year: '2007',
    genre: 'UK Garage',
    rating: '4',
    createdAt: '2026-04-14T00:00:00.000Z',
  },
];

beforeEach(() => {
  mockUseMusicAlbumCover.mockReturnValue({
    imageUrl: null,
    isLoading: false,
    error: null,
  });
});

describe('MusicLibraryList', () => {
  it('renders empty state when there are no items', () => {
    render(<MusicLibraryList items={[]} onRefreshAction={() => {}} onDeleteAction={() => {}} />);

    expect(screen.getByText('No saved tracks yet')).toBeInTheDocument();
  });

  it('renders items and triggers actions', () => {
    const onRefreshAction = vi.fn();
    const onDeleteAction = vi.fn();

    render(<MusicLibraryList items={items} onRefreshAction={onRefreshAction} onDeleteAction={onDeleteAction} />);

    expect(screen.getByText('Archangel')).toBeInTheDocument();
    expect(screen.getByText('Burial · Untrue')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onRefreshAction).toHaveBeenCalledTimes(1);
    expect(onDeleteAction).toHaveBeenCalledWith('item-1');
  });

  it('renders album cover image when the lookup succeeds', () => {
    mockUseMusicAlbumCover.mockReturnValue({
      imageUrl: 'https://coverartarchive.org/release-group/test/front-500.jpg',
      isLoading: false,
      error: null,
    });

    render(<MusicLibraryList items={items} onRefreshAction={() => {}} onDeleteAction={() => {}} />);

    expect(screen.getByAltText('Untrue album cover')).toBeInTheDocument();
  });

  it('renders custom content below the saved items section', () => {
    render(
      <MusicLibraryList items={items} onRefreshAction={() => {}} onDeleteAction={() => {}}>
        <div>Add Music Form</div>
      </MusicLibraryList>,
    );

    expect(screen.getByText('Add Music Form')).toBeInTheDocument();
  });

  it('requests cover lookup even when album is missing', () => {
    render(<MusicLibraryList items={artistOnlyItems} onRefreshAction={() => {}} onDeleteAction={() => {}} />);

    expect(mockUseMusicAlbumCover).toHaveBeenCalledWith({
      artist: 'Burial',
      album: undefined,
    });
  });
});

describe('MusicLibraryList - Snapshots', () => {
  it('matches snapshot with populated items and footer content', () => {
    const { container } = render(
      <MusicLibraryList items={items} onRefreshAction={() => {}} onDeleteAction={() => {}}>
        <div>Add Music Form</div>
      </MusicLibraryList>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
