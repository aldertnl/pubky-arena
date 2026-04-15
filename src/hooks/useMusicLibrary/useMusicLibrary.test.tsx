import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMusicLibrary } from './useMusicLibrary';

const { mockController, mockSettingsController, mockUseSettingsStore } = vi.hoisted(() => ({
  mockController: {
    getOrFetchMusicLibrary: vi.fn(),
    getMusicLibraryDraft: vi.fn(),
    saveMusicLibraryDraft: vi.fn(),
    commitCreateMusicItem: vi.fn(),
    commitDeleteMusicItem: vi.fn(),
    fetchMusicLibrary: vi.fn(),
  },
  mockSettingsController: {
    setMusicLibraryConsent: vi.fn(),
    setMusicLibraryBuyerSharingEnabled: vi.fn(),
  },
  mockUseSettingsStore: vi.fn(),
}));

vi.mock('@/core', () => ({
  MusicLibraryController: mockController,
  SettingsController: mockSettingsController,
  useSettingsStore: () => mockUseSettingsStore(),
  MusicLibraryNormalizer: {
    createEmptyDraft: () => ({
      recordingId: '',
      artist: '',
      album: '',
      track: '',
      year: '',
      genre: '',
      rating: '5',
    }),
  },
}));

describe('useMusicLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockController.getOrFetchMusicLibrary.mockResolvedValue(null);
    mockController.getMusicLibraryDraft.mockReturnValue(null);
    mockController.saveMusicLibraryDraft.mockImplementation((draft) => draft);
    mockController.fetchMusicLibrary.mockResolvedValue(null);
    mockSettingsController.setMusicLibraryConsent.mockResolvedValue(undefined);
    mockSettingsController.setMusicLibraryBuyerSharingEnabled.mockResolvedValue(undefined);
    mockUseSettingsStore.mockReturnValue({
      privacy: {
        musicLibraryConsent: false,
        musicLibraryBuyerSharingEnabled: false,
      },
    });
  });

  it('loads with empty items and default draft state', async () => {
    const { result } = renderHook(() => useMusicLibrary());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.draft).toEqual({
      recordingId: '',
      artist: '',
      album: '',
      track: '',
      year: '',
      genre: '',
      rating: '5',
    });
    expect(result.current.consent).toEqual({
      marketingEnabled: false,
      buyerSharingEnabled: false,
    });
  });

  it('maps consent state from settings store', async () => {
    mockUseSettingsStore.mockReturnValue({
      privacy: {
        musicLibraryConsent: true,
        musicLibraryBuyerSharingEnabled: true,
      },
    });

    const { result } = renderHook(() => useMusicLibrary());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.consent).toEqual({
      marketingEnabled: true,
      buyerSharingEnabled: true,
    });
  });

  it('adds a draft item and then clears the draft', async () => {
    mockController.commitCreateMusicItem.mockResolvedValue({
      version: 1,
      updatedAt: 100,
      items: [
        {
          id: 'item-1',
          artist: 'Nujabes',
          album: 'Modal Soul',
          track: 'Feather',
          year: 2005,
          genre: 'Hip-hop',
          rating: 5,
          createdAt: 1,
          updatedAt: 2,
        },
      ],
    });

    const { result } = renderHook(() => useMusicLibrary());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setDraftField('recordingId', 'track-1');
      result.current.setDraftField('artist', 'Nujabes');
      result.current.setDraftField('track', 'Feather');
      result.current.setDraftField('album', 'Modal Soul');
      result.current.setDraftField('genre', 'Hip-hop');
    });

    await act(async () => {
      await result.current.addDraftAsItem();
    });

    expect(mockController.commitCreateMusicItem).toHaveBeenCalledWith({
      recordingId: 'track-1',
      artist: 'Nujabes',
      album: 'Modal Soul',
      track: 'Feather',
      year: '',
      genre: 'Hip-hop',
      rating: '5',
    });
    expect(result.current.items[0]).toMatchObject({
      artist: 'Nujabes',
      track: 'Feather',
      album: 'Modal Soul',
      genre: 'Hip-hop',
      year: '2005',
      rating: '5',
    });
    expect(result.current.draft.artist).toBe('');
    expect(result.current.draft.track).toBe('');
  });

  it('removes an item after it has been added', async () => {
    mockController.getOrFetchMusicLibrary.mockResolvedValue({
      version: 1,
      updatedAt: 100,
      items: [
        {
          id: 'item-1',
          artist: 'Burial',
          album: 'Untrue',
          track: 'Archangel',
          year: 2007,
          genre: 'UK Garage',
          rating: 5,
          createdAt: 1,
          updatedAt: 2,
        },
      ],
    });
    mockController.commitDeleteMusicItem.mockResolvedValue({
      version: 1,
      updatedAt: 200,
      items: [],
    });

    const { result } = renderHook(() => useMusicLibrary());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const createdItemId = result.current.items[0]?.id;
    expect(createdItemId).toBe('item-1');

    await act(async () => {
      await result.current.removeItem(createdItemId as string);
    });

    expect(result.current.items).toEqual([]);
    expect(mockController.commitDeleteMusicItem).toHaveBeenCalledWith({ id: 'item-1' });
  });

  it('saves and restores a draft while sanitizing numeric fields', async () => {
    const { result } = renderHook(() => useMusicLibrary());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setDraftField('year', '20ab24');
      result.current.setDraftField('rating', '42');
      result.current.setDraftField('artist', 'DJ Shadow');
      result.current.setDraftField('track', 'Midnight in a Perfect World');
    });

    act(() => {
      result.current.saveDraft();
    });

    act(() => {
      result.current.clearDraft();
    });

    act(() => {
      result.current.restoreDraft();
    });

    expect(result.current.draft).toMatchObject({
      year: '2024',
      rating: '4',
      artist: 'DJ Shadow',
      track: 'Midnight in a Perfect World',
    });
    expect(result.current.savedDraft).not.toBeNull();
    expect(mockController.saveMusicLibraryDraft).toHaveBeenCalledWith({
      recordingId: '',
      artist: 'DJ Shadow',
      album: '',
      track: 'Midnight in a Perfect World',
      year: '2024',
      genre: '',
      rating: '4',
    });
  });

  it('updates marketing consent through settings controller', async () => {
    const { result } = renderHook(() => useMusicLibrary());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setConsent('marketingEnabled', true);
    });

    expect(mockSettingsController.setMusicLibraryConsent).toHaveBeenCalledWith(true);
  });

  it('does not enable buyer sharing before primary consent', async () => {
    const { result } = renderHook(() => useMusicLibrary());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.setConsent('buyerSharingEnabled', true);
    });

    expect(mockSettingsController.setMusicLibraryBuyerSharingEnabled).not.toHaveBeenCalled();
  });
});
