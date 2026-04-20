import * as Core from '@/core';

export class MusicLibraryTrackDetailsController {
  private constructor() {}

  static async fetch(
    params: Partial<Core.TMusicLibraryTrackDetailsParams>,
  ): Promise<Core.TMusicLibraryTrackDetailsResult> {
    const validated = Core.MusicLibraryTrackDetailsValidators.validate(params);
    return Core.MusicLibraryTrackDetailsApplication.fetch(validated);
  }
}
