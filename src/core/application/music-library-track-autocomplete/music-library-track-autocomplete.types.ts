export interface TMusicLibraryTrackAutocompleteParams {
  query: string;
  limit: number;
}

export interface TMusicLibraryTrackSuggestion {
  id: string;
  track: string;
  artist: string;
  album: string | null;
  year: string | null;
}

export interface TMusicLibraryTrackAutocompleteResult {
  suggestions: TMusicLibraryTrackSuggestion[];
}
