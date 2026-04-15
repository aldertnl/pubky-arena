export interface MusicTrackSuggestion {
  id: string;
  track: string;
  artist: string;
  album: string | null;
  year: string | null;
}

export interface UseMusicTrackAutocompleteParams {
  query: string;
  enabled?: boolean;
}

export interface UseMusicTrackAutocompleteResult {
  suggestions: MusicTrackSuggestion[];
  isLoading: boolean;
}
