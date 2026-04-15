import * as Core from '@/core';

export class MusicLibraryAlbumCoverController {
  private constructor() {}

  static async fetch(params: Partial<Core.TMusicLibraryAlbumCoverParams>): Promise<Core.TMusicLibraryAlbumCoverResult> {
    const validated = Core.MusicLibraryAlbumCoverValidators.validate(params);
    return Core.MusicLibraryAlbumCoverApplication.fetch(validated);
  }
}
