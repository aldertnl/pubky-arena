import validationLimits from 'pubky-app-specs/validationLimits.json';
import {
  isFeedDeleteParams,
  type TFeedPersistCreateParams,
  type TFeedPersistDeleteParams,
  type TFeedPersistParams,
} from '@/application/feed/feed.types';
import { DEFAULT_CUSTOM_FEED_ICON } from '@/config/feed';
import { ValidationErrorCode } from '@/libs/error/error.codes';
import { Err } from '@/libs/error/error.factories';
import { ErrorService } from '@/libs/error/error.types';

const MIN_TAGS = 1;
const MAX_TAGS = validationLimits.feedTagsMaxCount;
const MAX_ICON_LENGTH = validationLimits.feedIconMaxLength;

export class FeedValidators {
  private constructor() {}

  /**
   * Coerces an icon coming from storage or a remote payload into a value
   * `PubkySpecsBuilder.createFeed` will accept.
   *
   * Specs rejects both an empty icon and one longer than `feedIconMaxLength`,
   * and `createFeed` throws on rejection — during bootstrap that throw is
   * caught per-feed, so an unusable icon would silently drop the whole feed
   * from the user's list. Falling back to the default keeps the feed.
   *
   * Names that are merely unknown to us (another client's icon set) pass
   * through untouched so a round-trip through this app does not overwrite
   * them; the UI already renders a fallback for names it cannot resolve.
   */
  static sanitizeIcon(icon: string | undefined | null): string {
    const trimmed = icon?.trim();

    if (!trimmed || trimmed.length > MAX_ICON_LENGTH) return DEFAULT_CUSTOM_FEED_ICON;

    return trimmed;
  }

  /**
   * Validates and normalizes tags for a feed.
   * Throws an error if validation fails.
   *
   * @param tags - Array of tag strings to validate
   * @returns Normalized array of unique, lowercase tags
   * @throws Error if tags are invalid
   */
  static validateTags(tags: string[] | undefined | null): string[] {
    if (!tags || tags.length < MIN_TAGS) {
      throw Err.validation(ValidationErrorCode.INVALID_INPUT, 'At least one tag is required', {
        service: ErrorService.PubkyAppSpecs,
        operation: 'validateTags',
        context: { tags },
      });
    }

    if (tags.length > MAX_TAGS) {
      throw Err.validation(ValidationErrorCode.INVALID_INPUT, `Maximum ${MAX_TAGS} tags allowed`, {
        service: ErrorService.PubkyAppSpecs,
        operation: 'validateTags',
        context: { tags },
      });
    }

    const normalizedTags = [...new Set(tags.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0))];

    if (normalizedTags.length < MIN_TAGS) {
      throw Err.validation(ValidationErrorCode.INVALID_INPUT, 'At least one unique tag is required', {
        service: ErrorService.PubkyAppSpecs,
        operation: 'validateTags',
        context: { tags },
      });
    }

    return normalizedTags;
  }

  /**
   * Validates that params are valid for DELETE action.
   * Throws an error if validation fails.
   *
   * @param params - Parameters to validate
   * @throws Error if params are invalid for DELETE action
   */
  static validateDeleteParams(params: TFeedPersistParams): asserts params is TFeedPersistDeleteParams {
    if (!isFeedDeleteParams(params)) {
      throw Err.validation(ValidationErrorCode.INVALID_INPUT, 'Invalid params for DELETE action', {
        service: ErrorService.PubkyAppSpecs,
        operation: 'validateDeleteParams',
        context: { params },
      });
    }
  }

  /**
   * Validates that params are valid for PUT action.
   * Throws an error if validation fails.
   *
   * @param params - Parameters to validate
   * @throws Error if params are invalid for PUT action
   */
  static validatePutParams(params: TFeedPersistParams): asserts params is TFeedPersistCreateParams {
    if (isFeedDeleteParams(params)) {
      throw Err.validation(ValidationErrorCode.INVALID_INPUT, 'Invalid params for PUT action', {
        service: ErrorService.PubkyAppSpecs,
        operation: 'validatePutParams',
        context: { params },
      });
    }
  }
}
