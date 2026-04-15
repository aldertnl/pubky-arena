import * as Core from '@/core';
import { Err, ErrorService, HttpStatusCode, ValidationErrorCode } from '@/libs';

export class MusicLibraryAlbumCoverValidators {
  private constructor() {}

  static validate(params: Partial<Core.TMusicLibraryAlbumCoverParams>): Core.TMusicLibraryAlbumCoverParams {
    const artist = params.artist?.trim();
    const album = params.album?.trim();

    if (!artist) {
      throw Err.validation(ValidationErrorCode.MISSING_FIELD, 'Artist is required.', {
        service: ErrorService.NextJsServer,
        operation: 'validateMusicLibraryAlbumCover',
        context: { field: 'artist', statusCode: HttpStatusCode.BAD_REQUEST },
      });
    }

    return {
      artist,
      album: album || undefined,
    };
  }
}
