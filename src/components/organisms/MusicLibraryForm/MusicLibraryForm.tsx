'use client';

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react';
import * as Atoms from '@/atoms';
import * as Hooks from '@/hooks';
import * as Libs from '@/libs';

const RATING_OPTIONS = ['1', '2', '3', '4', '5'] as const;
const TRACK_AUTOCOMPLETE_BLUR_DELAY_MS = 100;
const trackDetailsCache = new Map<string, TrackDetailsResult>();

export interface MusicLibraryFormProps {
  draft: Hooks.MusicLibraryDraft;
  isLoading?: boolean;
  isSaving?: boolean;
  onDraftFieldChange: (field: keyof Hooks.MusicLibraryDraft, value: string) => void;
  onSubmitAction: () => void | Promise<void>;
  onResetAction: () => void;
}

interface TrackAutocompleteInputProps {
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSuggestionSelect: (suggestion: Hooks.MusicTrackSuggestion) => void | Promise<void>;
}

interface TrackDetailsResult {
  artist: string;
  album: string | null;
  year: string | null;
  genre: string | null;
}

export function MusicLibraryForm({
  draft,
  isLoading = false,
  isSaving = false,
  onDraftFieldChange,
  onSubmitAction,
  onResetAction,
}: MusicLibraryFormProps) {
  const [searchValue, setSearchValue] = useState(() => getSearchInputValue(draft));
  const isEditingQueryRef = useRef(false);
  const { imageUrl, isLoading: isCoverLoading } = Hooks.useMusicAlbumCover(
    draft.artist
      ? {
          artist: draft.artist,
          album: draft.album || undefined,
        }
      : null,
  );

  useEffect(() => {
    if (draft.recordingId) {
      isEditingQueryRef.current = false;
      setSearchValue(getSearchInputValue(draft));
      return;
    }

    if (!isEditingQueryRef.current && !draft.artist && !draft.album && !draft.track && !draft.year && !draft.genre) {
      setSearchValue('');
    }
  }, [draft.recordingId, draft.artist, draft.track, draft.album, draft.year, draft.genre]);

  const handleSearchChange = (value: string) => {
    isEditingQueryRef.current = true;
    setSearchValue(value);
    onDraftFieldChange('recordingId', '');
    onDraftFieldChange('artist', '');
    onDraftFieldChange('album', '');
    onDraftFieldChange('track', '');
    onDraftFieldChange('year', '');
    onDraftFieldChange('genre', '');
  };

  const handleSuggestionSelect = async (suggestion: Hooks.MusicTrackSuggestion) => {
    isEditingQueryRef.current = false;
    setSearchValue(suggestion.track);
    onDraftFieldChange('recordingId', suggestion.id);
    onDraftFieldChange('track', suggestion.track);
    onDraftFieldChange('artist', suggestion.artist);
    onDraftFieldChange('album', suggestion.album ?? '');
    onDraftFieldChange('year', suggestion.year ?? '');
    onDraftFieldChange('genre', '');

    const details = await fetchTrackDetails(suggestion.id);
    const resolvedArtist = details?.artist || suggestion.artist;
    const resolvedAlbum = details?.album ?? suggestion.album ?? '';

    if (details) {
      onDraftFieldChange('artist', resolvedArtist);
      onDraftFieldChange('album', resolvedAlbum);
      onDraftFieldChange('year', details.year ?? suggestion.year ?? '');
      onDraftFieldChange('genre', details.genre ?? '');
    }

    void Hooks.prefetchMusicAlbumCover({
      artist: resolvedArtist,
      album: resolvedAlbum || undefined,
    });
  };

  const metadata = [
    { label: 'Artist', value: draft.artist },
    { label: 'Track', value: draft.track },
    { label: 'Album', value: draft.album },
    { label: 'Year', value: draft.year },
    { label: 'Genre', value: draft.genre },
  ].filter((entry) => Boolean(entry.value));

  const isAddDisabled = !draft.recordingId || isLoading || isSaving;
  const handleReset = () => {
    isEditingQueryRef.current = false;
    setSearchValue('');
    onResetAction();
  };

  return (
    <section className="w-full min-w-0 space-y-4">
      <Atoms.Container overrideDefaults={true} className="gap-1">
        <Atoms.Typography as="h2" className="text-base font-semibold text-foreground">
          Add Music
        </Atoms.Typography>
        <Atoms.Typography as="p" className="text-sm text-muted-foreground">
          Search once and we&apos;ll fill in the artist, album, year, and genre before you rate it.
        </Atoms.Typography>
      </Atoms.Container>

      <div className="space-y-4">
        <label className="flex flex-col gap-2">
          <Atoms.Typography as="span" className="text-sm font-medium text-foreground">
            Search
          </Atoms.Typography>
          <TrackAutocompleteInput
            value={searchValue}
            placeholder="Search artist, track, or album"
            disabled={isLoading || isSaving}
            onChange={handleSearchChange}
            onSuggestionSelect={handleSuggestionSelect}
          />
          <Atoms.Typography as="span" className="text-xs text-muted-foreground">
            Pick a result to unlock `Add Item`.
          </Atoms.Typography>
        </label>

        {metadata.length > 0 ? (
          <div className="rounded-lg border bg-muted/30 p-4">
            <Atoms.Container overrideDefaults={true} className="gap-3">
              <Atoms.Container overrideDefaults={true} className="flex items-start gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-full border bg-background">
                  {imageUrl ? (
                    <Atoms.Image
                      fill
                      src={imageUrl}
                      alt={`${draft.album || draft.track} album cover`}
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] font-medium text-muted-foreground">
                      {isCoverLoading ? 'Loading cover...' : 'No cover'}
                    </div>
                  )}
                </div>

                <Atoms.Container overrideDefaults={true} className="min-w-0 flex-1 gap-3">
                  <Atoms.Container overrideDefaults={true} className="gap-1">
                    <Atoms.Typography as="p" className="text-sm font-medium text-foreground">
                      Selected result
                    </Atoms.Typography>
                    <Atoms.Typography as="p" className="text-xs text-muted-foreground">
                      Metadata comes from the search result and track details lookup.
                    </Atoms.Typography>
                  </Atoms.Container>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {metadata.map((entry) => (
                      <Atoms.Container key={entry.label} overrideDefaults={true} className="gap-1">
                        <Atoms.Typography
                          as="span"
                          className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                        >
                          {entry.label}
                        </Atoms.Typography>
                        <Atoms.Typography as="p" className="text-sm break-words text-foreground">
                          {entry.value}
                        </Atoms.Typography>
                      </Atoms.Container>
                    ))}
                  </div>
                </Atoms.Container>
              </Atoms.Container>
            </Atoms.Container>
          </div>
        ) : null}

        <Atoms.Container overrideDefaults={true} className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <Atoms.Typography as="span" className="text-sm font-medium text-foreground">
              Rating
            </Atoms.Typography>
            <Atoms.Select
              value={draft.rating}
              onValueChange={(value) => onDraftFieldChange('rating', value)}
              disabled={isLoading || isSaving}
            >
              <Atoms.SelectTrigger className="h-9 w-full rounded-md border border-input px-3 py-2 text-left font-medium">
                <Atoms.SelectValue placeholder="Select rating" />
              </Atoms.SelectTrigger>
              <Atoms.SelectContent position="popper" align="start">
                {RATING_OPTIONS.map((rating) => (
                  <Atoms.SelectItem key={rating} value={rating}>
                    {rating}/5
                  </Atoms.SelectItem>
                ))}
              </Atoms.SelectContent>
            </Atoms.Select>
          </label>
        </Atoms.Container>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Atoms.Button
          variant="ghost"
          onClick={handleReset}
          disabled={isLoading || isSaving}
          className="w-full px-0 sm:w-auto sm:px-4"
        >
          Reset
        </Atoms.Button>
        <Atoms.Button
          variant="brand"
          onClick={onSubmitAction}
          disabled={isAddDisabled}
          className="w-full px-0 sm:w-auto sm:px-4"
        >
          {isSaving ? 'Saving...' : 'Add Item'}
        </Atoms.Button>
      </div>
    </section>
  );
}

function TrackAutocompleteInput({
  value,
  placeholder,
  disabled,
  onChange,
  onSuggestionSelect,
}: TrackAutocompleteInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { suggestions, isLoading } = Hooks.useMusicTrackAutocomplete({
    query: value,
    enabled: showSuggestions && !disabled,
  });

  const closeSuggestions = () => {
    setShowSuggestions(false);
    resetSelection();
  };

  const selectSuggestion = (suggestion: Hooks.MusicTrackSuggestion) => {
    void onSuggestionSelect(suggestion);
    closeSuggestions();
    inputRef.current?.focus();
  };

  const {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown: handleListboxKeyDown,
    resetSelection,
  } = Hooks.useListboxNavigation({
    items: suggestions,
    isOpen: showSuggestions && suggestions.length > 0,
    onSelect: (suggestion) => selectSuggestion(suggestion),
    onClose: closeSuggestions,
  });

  const isListboxOpen =
    showSuggestions &&
    value.trim().length >= Hooks.MUSIC_TRACK_AUTOCOMPLETE_MIN_QUERY_LENGTH &&
    (isLoading || suggestions.length > 0);

  const handleInputBlur = () => {
    window.setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        closeSuggestions();
      }
    }, TRACK_AUTOCOMPLETE_BLUR_DELAY_MS);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
    setShowSuggestions(true);
    resetSelection();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (handleListboxKeyDown(event)) {
      return;
    }

    if (event.key === 'Escape' && isListboxOpen) {
      event.preventDefault();
      closeSuggestions();
    }
  };

  const preventBlur = (event: MouseEvent) => {
    event.preventDefault();
  };

  return (
    <Atoms.Popover open={isListboxOpen}>
      <Atoms.PopoverAnchor asChild>
        <div ref={containerRef}>
          <Atoms.Input
            ref={inputRef}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            aria-autocomplete="list"
            aria-expanded={isListboxOpen}
            aria-controls="music-track-suggestions"
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
          />
        </div>
      </Atoms.PopoverAnchor>

      {isListboxOpen && (
        <Atoms.PopoverContent
          align="start"
          side="bottom"
          sideOffset={4}
          avoidCollisions={false}
          className="z-50 w-[min(var(--radix-popover-anchor-width),calc(100vw-3rem))] max-w-full p-0"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onFocusOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          {isLoading ? (
            <div className="rounded-md border bg-popover px-3 py-2 text-sm text-muted-foreground">Searching...</div>
          ) : (
            <div id="music-track-suggestions" role="listbox" className="rounded-md border bg-popover p-1 shadow-md">
              {suggestions.map((suggestion, index) => {
                const meta = [suggestion.artist, suggestion.album, suggestion.year].filter(Boolean).join(' • ');

                return (
                  <button
                    key={suggestion.id}
                    type="button"
                    role="option"
                    aria-selected={selectedIndex === index}
                    className={Libs.cn(
                      'flex w-full flex-col rounded-sm px-3 py-2 text-left transition-colors',
                      selectedIndex === index ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                    )}
                    onMouseDown={preventBlur}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <span className="text-sm font-medium break-words text-foreground">{suggestion.track}</span>
                    {meta ? <span className="text-xs break-words text-muted-foreground">{meta}</span> : null}
                  </button>
                );
              })}
            </div>
          )}
        </Atoms.PopoverContent>
      )}
    </Atoms.Popover>
  );
}

async function fetchTrackDetails(recordingId: string): Promise<TrackDetailsResult | null> {
  const cached = trackDetailsCache.get(recordingId);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(`/api/music-library/track-details?recordingId=${encodeURIComponent(recordingId)}`);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as TrackDetailsResult;
    trackDetailsCache.set(recordingId, data);
    return data;
  } catch {
    return null;
  }
}

function getSearchInputValue(draft: Hooks.MusicLibraryDraft): string {
  if (draft.track.trim()) {
    return draft.track;
  }

  if (draft.album.trim()) {
    return draft.album;
  }

  if (draft.artist.trim()) {
    return draft.artist;
  }

  return '';
}
