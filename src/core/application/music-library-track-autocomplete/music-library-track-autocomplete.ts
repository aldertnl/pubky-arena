import * as Core from '@/core';

export class MusicLibraryTrackAutocompleteApplication {
  private constructor() {}

  static async fetch(params: Core.TMusicLibraryTrackAutocompleteParams): Promise<Core.TMusicLibraryTrackAutocompleteResult> {
    return Core.NextJsMusicLibraryTrackAutocompleteService.fetch(params);
  }
}
