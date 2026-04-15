import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileExperimentsPage from './page';

const mockUseMusicLibrary = vi.fn();
const mockUseSettingsStore = vi.fn();
const mockSetShowMusicLibraryProfileSummary = vi.fn();

vi.mock('@/core', () => ({
  useSettingsStore: () => mockUseSettingsStore(),
}));

vi.mock('@/hooks', () => ({
  useMusicLibrary: () => mockUseMusicLibrary(),
  useSettingsActions: () => ({
    setShowMusicLibraryProfileSummary: mockSetShowMusicLibraryProfileSummary,
  }),
}));

vi.mock('@/organisms', () => ({
  MusicLibraryConsent: () => <div data-testid="music-library-consent" />,
  MusicLibraryForm: () => <div data-testid="music-library-form" />,
  MusicLibraryList: () => <div data-testid="music-library-list" />,
}));

describe('ProfileExperimentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseSettingsStore.mockReturnValue({
      privacy: {
        showMusicLibraryProfileSummary: false,
      },
    });

    mockUseMusicLibrary.mockReturnValue({
      items: [],
      draft: {
        recordingId: '',
        artist: '',
        album: '',
        track: '',
        year: '',
        genre: '',
        rating: '',
      },
      savedDraft: null,
      consent: {
        marketingEnabled: false,
        buyerSharingEnabled: false,
      },
      error: null,
      isLoading: false,
      isSaving: false,
      isUpdatingConsent: false,
      setDraftField: vi.fn(),
      addDraftAsItem: vi.fn(),
      removeItem: vi.fn(),
      saveDraft: vi.fn(),
      clearDraft: vi.fn(),
      restoreDraft: vi.fn(),
      setConsent: vi.fn(),
      refresh: vi.fn(),
    });
  });

  it('toggles the right sidebar music summary setting with the switch', () => {
    render(<ProfileExperimentsPage />);

    expect(screen.getByText('Music Snapshot Sidebar')).toBeInTheDocument();
    expect(screen.getByText(/desktop profile sidebar/i)).toBeInTheDocument();

    const toggle = screen.getByRole('switch', { name: 'Show music snapshot in right sidebar' });

    fireEvent.click(toggle);

    expect(mockSetShowMusicLibraryProfileSummary).toHaveBeenCalledWith(true);
  });
});
