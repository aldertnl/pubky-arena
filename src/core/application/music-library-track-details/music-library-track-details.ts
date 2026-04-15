import * as Core from '@/core';

export class MusicLibraryTrackDetailsApplication {
  private constructor() {}

  static async fetch(params: Core.TMusicLibraryTrackDetailsParams): Promise<Core.TMusicLibraryTrackDetailsResult> {
    return Core.NextJsMusicLibraryTrackDetailsService.fetch(params);
  }
}
