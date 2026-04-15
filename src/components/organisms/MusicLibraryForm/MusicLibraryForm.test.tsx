import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseMusicTrackAutocomplete } = vi.hoisted(() => ({
  mockUseMusicTrackAutocomplete: vi.fn(),
}));

vi.mock('@/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/hooks')>('@/hooks');

  return {
    ...actual,
    useMusicTrackAutocomplete: (...args: unknown[]) => mockUseMusicTrackAutocomplete(...args),
  };
});

import { MusicLibraryForm } from './MusicLibraryForm';

const defaultDraft = {
  recordingId: 'track-1',
  artist: 'Nujabes',
  album: 'Modal Soul',
  track: 'Feather',
  year: '2005',
  genre: 'Hip-hop',
  rating: '5',
};

describe('MusicLibraryForm', () => {
  beforeEach(() => {
    mockUseMusicTrackAutocomplete.mockReturnValue({
      suggestions: [],
      isLoading: false,
    });
    global.fetch = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
  });

  it('renders fields and actions', () => {
    render(
      <MusicLibraryForm
        draft={defaultDraft}
        onDraftFieldChange={() => {}}
        onSubmitAction={() => {}}
        onResetAction={() => {}}
      />,
    );

    expect(screen.getByText('Add Music')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Feather')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save Draft' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Restore Draft' })).not.toBeInTheDocument();
  });

  it('keeps Add Item disabled until a search result is selected', () => {
    render(
      <MusicLibraryForm
        draft={{ ...defaultDraft, recordingId: '', artist: '', album: '', track: '', year: '', genre: '' }}
        onDraftFieldChange={() => {}}
        onSubmitAction={() => {}}
        onResetAction={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Add Item' })).toBeDisabled();
  });

  it('calls callbacks for form actions', () => {
    const onSubmitAction = vi.fn();
    const onResetAction = vi.fn();

    render(
      <MusicLibraryForm
        draft={defaultDraft}
        onDraftFieldChange={() => {}}
        onSubmitAction={onSubmitAction}
        onResetAction={onResetAction}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Item' }));

    expect(onResetAction).toHaveBeenCalledTimes(1);
    expect(onSubmitAction).toHaveBeenCalledTimes(1);
  });

  it('shows track suggestions and selects one on click', () => {
    const onDraftFieldChange = vi.fn();
    mockUseMusicTrackAutocomplete.mockReturnValue({
      suggestions: [
        {
          id: 'track-1',
          track: 'Feather (Radio Edit)',
          artist: 'Nujabes feat. Cise Starr',
          album: 'Modal Soul',
          year: '2005',
        },
      ],
      isLoading: false,
    });

    render(
      <MusicLibraryForm
        draft={defaultDraft}
        onDraftFieldChange={onDraftFieldChange}
        onSubmitAction={() => {}}
        onResetAction={() => {}}
      />,
    );

    fireEvent.focus(screen.getByDisplayValue('Feather'));
    fireEvent.click(screen.getByText('Feather (Radio Edit)'));

    expect(onDraftFieldChange).toHaveBeenNthCalledWith(1, 'recordingId', 'track-1');
    expect(onDraftFieldChange).toHaveBeenNthCalledWith(2, 'track', 'Feather (Radio Edit)');
    expect(onDraftFieldChange).toHaveBeenNthCalledWith(3, 'artist', 'Nujabes feat. Cise Starr');
    expect(onDraftFieldChange).toHaveBeenNthCalledWith(4, 'album', 'Modal Soul');
    expect(onDraftFieldChange).toHaveBeenNthCalledWith(5, 'year', '2005');
  });

  it('selects the highlighted track suggestion with keyboard navigation', () => {
    const onDraftFieldChange = vi.fn();
    mockUseMusicTrackAutocomplete.mockReturnValue({
      suggestions: [
        {
          id: 'track-1',
          track: 'Feather (Radio Edit)',
          artist: 'Nujabes feat. Cise Starr',
          album: 'Modal Soul',
          year: '2005',
        },
        {
          id: 'track-2',
          track: 'Luv(sic.) pt3',
          artist: 'Nujabes feat. Shing02',
          album: null,
          year: '2003',
        },
      ],
      isLoading: false,
    });

    render(
      <MusicLibraryForm
        draft={defaultDraft}
        onDraftFieldChange={onDraftFieldChange}
        onSubmitAction={() => {}}
        onResetAction={() => {}}
      />,
    );

    const trackInput = screen.getByDisplayValue('Feather');
    fireEvent.focus(trackInput);
    fireEvent.keyDown(trackInput, { key: 'ArrowDown' });
    fireEvent.keyDown(trackInput, { key: 'Enter' });

    expect(onDraftFieldChange).toHaveBeenNthCalledWith(1, 'recordingId', 'track-1');
    expect(onDraftFieldChange).toHaveBeenNthCalledWith(2, 'track', 'Feather (Radio Edit)');
    expect(onDraftFieldChange).toHaveBeenNthCalledWith(3, 'artist', 'Nujabes feat. Cise Starr');
    expect(onDraftFieldChange).toHaveBeenNthCalledWith(4, 'album', 'Modal Soul');
    expect(onDraftFieldChange).toHaveBeenNthCalledWith(5, 'year', '2005');
  });
});

describe('MusicLibraryForm - Snapshots', () => {
  it('matches snapshot with saved draft available', () => {
    const { container } = render(
      <MusicLibraryForm
        draft={defaultDraft}
        onDraftFieldChange={() => {}}
        onSubmitAction={() => {}}
        onResetAction={() => {}}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
