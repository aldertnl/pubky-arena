import * as Core from '@/core';
import { Err, ErrorService, HttpStatusCode, ValidationErrorCode } from '@/libs';

export class MusicLibraryTrackDetailsValidators {
  private constructor() {}

  static validate(params: Partial<Core.TMusicLibraryTrackDetailsParams>): Core.TMusicLibraryTrackDetailsParams {
    const recordingId = params.recordingId?.trim();

    if (!recordingId) {
      throw Err.validation(ValidationErrorCode.MISSING_FIELD, 'Recording ID is required.', {
        service: ErrorService.NextJsServer,
        operation: 'validateMusicLibraryTrackDetails',
        context: { field: 'recordingId', statusCode: HttpStatusCode.BAD_REQUEST },
      });
    }

    return {
      recordingId,
    };
  }
}
