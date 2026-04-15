import * as Core from '@/core';

export class MusicLibraryAlbumCoverApplication {
  private constructor() {}

  static async fetch(params: Core.TMusicLibraryAlbumCoverParams): Promise<Core.TMusicLibraryAlbumCoverResult> {
    return Core.NextJsMusicLibraryAlbumCoverService.fetch(params);
  }
}
