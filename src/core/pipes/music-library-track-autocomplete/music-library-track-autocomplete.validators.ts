import * as Core from '@/core';
import { Err, ErrorService, HttpStatusCode, ValidationErrorCode } from '@/libs';

export const MUSIC_LIBRARY_TRACK_AUTOCOMPLETE_LIMIT = 20;
export const MUSIC_LIBRARY_TRACK_AUTOCOMPLETE_MIN_QUERY_LENGTH = 3;

export class MusicLibraryTrackAutocompleteValidators {
  private constructor() {}

  static validate(params: Partial<Core.TMusicLibraryTrackAutocompleteParams>): Core.TMusicLibraryTrackAutocompleteParams {
    const query = params.query?.trim();

    if (!query) {
      throw Err.validation(ValidationErrorCode.MISSING_FIELD, 'Search query is required.', {
        service: ErrorService.NextJsServer,
        operation: 'validateMusicLibraryTrackAutocomplete',
        context: { field: 'query', statusCode: HttpStatusCode.BAD_REQUEST },
      });
    }

    if (query.length < MUSIC_LIBRARY_TRACK_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
      throw Err.validation(
        ValidationErrorCode.INVALID_INPUT,
        `Search query must be at least ${MUSIC_LIBRARY_TRACK_AUTOCOMPLETE_MIN_QUERY_LENGTH} characters.`,
        {
          service: ErrorService.NextJsServer,
          operation: 'validateMusicLibraryTrackAutocomplete',
          context: { field: 'query', statusCode: HttpStatusCode.BAD_REQUEST },
        },
      );
    }

    return {
      query,
      limit: MUSIC_LIBRARY_TRACK_AUTOCOMPLETE_LIMIT,
    };
  }
}
