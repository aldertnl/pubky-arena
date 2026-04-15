import * as Core from '@/core';

export class MusicLibraryTrackAutocompleteController {
  private constructor() {}

  static async fetch(
    params: Partial<Core.TMusicLibraryTrackAutocompleteParams>,
  ): Promise<Core.TMusicLibraryTrackAutocompleteResult> {
    const validated = Core.MusicLibraryTrackAutocompleteValidators.validate(params);
    return Core.MusicLibraryTrackAutocompleteApplication.fetch(validated);
  }
}
