'use client';

import { useEffect, useState } from 'react';
import * as Core from '@/core';
import { isAppError } from '@/libs';

export interface MusicLibraryItem {
  id: string;
  artist: string;
  album: string;
  track: string;
  year: string;
  genre: string;
  rating: string;
  createdAt: string;
}

export interface MusicLibraryDraft {
  recordingId: string;
  artist: string;
  album: string;
  track: string;
  year: string;
  genre: string;
  rating: string;
}

export interface MusicLibraryConsentState {
  marketingEnabled: boolean;
  buyerSharingEnabled: boolean;
}

export interface UseMusicLibraryReturn {
  items: MusicLibraryItem[];
  draft: MusicLibraryDraft;
  savedDraft: MusicLibraryDraft | null;
  consent: MusicLibraryConsentState;
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  isUpdatingConsent: boolean;
  setDraftField: (field: keyof MusicLibraryDraft, value: string) => void;
  addDraftAsItem: () => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  saveDraft: () => void;
  clearDraft: () => void;
  restoreDraft: () => void;
  setConsent: (field: keyof MusicLibraryConsentState, value: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const INITIAL_DRAFT: MusicLibraryDraft = {
  recordingId: Core.MusicLibraryNormalizer.createEmptyDraft().recordingId,
  artist: Core.MusicLibraryNormalizer.createEmptyDraft().artist,
  album: Core.MusicLibraryNormalizer.createEmptyDraft().album,
  track: Core.MusicLibraryNormalizer.createEmptyDraft().track,
  year: Core.MusicLibraryNormalizer.createEmptyDraft().year,
  genre: Core.MusicLibraryNormalizer.createEmptyDraft().genre,
  rating: Core.MusicLibraryNormalizer.createEmptyDraft().rating,
};

export function useMusicLibrary(): UseMusicLibraryReturn {
  const { privacy } = Core.useSettingsStore();
  const [items, setItems] = useState<MusicLibraryItem[]>([]);
  const [draft, setDraft] = useState<MusicLibraryDraft>(INITIAL_DRAFT);
  const [savedDraft, setSavedDraft] = useState<MusicLibraryDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);

  const consent: MusicLibraryConsentState = {
    marketingEnabled: privacy.musicLibraryConsent,
    buyerSharingEnabled: privacy.musicLibraryBuyerSharingEnabled,
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [document, existingDraft] = await Promise.all([
          Core.MusicLibraryController.getOrFetchMusicLibrary(),
          Promise.resolve(Core.MusicLibraryController.getMusicLibraryDraft()),
        ]);

        if (cancelled) {
          return;
        }

        setItems(mapDocumentToItems(document));
        setDraft(existingDraft ?? INITIAL_DRAFT);
        setSavedDraft(existingDraft ?? null);
      } catch (loadError) {
        if (!cancelled) {
          setError(isAppError(loadError) ? loadError.message : 'Failed to load your music library.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const setDraftField = (field: keyof MusicLibraryDraft, value: string) => {
    const sanitizedValue =
      field === 'year'
        ? value.replace(/\D/g, '').slice(0, 4)
        : field === 'rating'
          ? value.replace(/\D/g, '').slice(0, 1)
          : value;

    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: sanitizedValue,
    }));
  };

  const clearDraft = () => {
    setDraft(INITIAL_DRAFT);
    setError(null);
  };

  const saveDraft = () => {
    try {
      const persistedDraft = Core.MusicLibraryController.saveMusicLibraryDraft(draft);
      setSavedDraft(persistedDraft);
      setDraft(persistedDraft);
      setError(null);
    } catch (saveError) {
      setError(isAppError(saveError) ? saveError.message : 'Failed to save your music library draft.');
    }
  };

  const restoreDraft = () => {
    if (!savedDraft) {
      return;
    }

    setDraft(savedDraft);
    setError(null);
  };

  const addDraftAsItem = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const document = await Core.MusicLibraryController.commitCreateMusicItem(draft);
      setItems(mapDocumentToItems(document));
      setDraft(INITIAL_DRAFT);
      setSavedDraft(null);
    } catch (saveError) {
      setError(isAppError(saveError) ? saveError.message : 'Failed to save this music item.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeItem = async (id: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const document = await Core.MusicLibraryController.commitDeleteMusicItem({ id });
      setItems(mapDocumentToItems(document));
    } catch (deleteError) {
      setError(isAppError(deleteError) ? deleteError.message : 'Failed to delete this music item.');
    } finally {
      setIsSaving(false);
    }
  };

  const setConsent = async (field: keyof MusicLibraryConsentState, value: boolean) => {
    setIsUpdatingConsent(true);
    setError(null);

    try {
      if (field === 'marketingEnabled') {
        await Core.SettingsController.setMusicLibraryConsent(value);
        return;
      }

      if (value && !privacy.musicLibraryConsent) {
        return;
      }

      await Core.SettingsController.setMusicLibraryBuyerSharingEnabled(value);
    } catch (consentError) {
      setError(isAppError(consentError) ? consentError.message : 'Failed to update music library consent settings.');
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  const refresh = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const document = await Core.MusicLibraryController.fetchMusicLibrary();
      setItems(mapDocumentToItems(document));
    } catch (refreshError) {
      setError(isAppError(refreshError) ? refreshError.message : 'Failed to refresh your music library.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    items,
    draft,
    savedDraft,
    consent,
    error,
    isLoading,
    isSaving,
    isUpdatingConsent,
    setDraftField,
    addDraftAsItem,
    removeItem,
    saveDraft,
    clearDraft,
    restoreDraft,
    setConsent,
    refresh,
  };
}

function mapDocumentToItems(document: Core.MusicLibraryDocument | null): MusicLibraryItem[] {
  if (!document) {
    return [];
  }

  return document.items.map((item) => ({
    id: item.id,
    artist: item.artist,
    album: item.album,
    track: item.track,
    year: item.year?.toString() ?? '',
    genre: item.genre,
    rating: item.rating?.toString() ?? '',
    createdAt: new Date(item.createdAt).toISOString(),
  }));
}
