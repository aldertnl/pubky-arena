import {
  FeedResult,
  PubkyAppFeedLayout,
  PubkyAppFeedReach,
  PubkyAppFeedSort,
  PubkyAppPostKind,
  PubkySpecsBuilder,
} from 'pubky-app-specs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TFeedCreateParams } from '@/controllers/feed/feed.types';
import { AppError } from '@/libs/error/error';
import { ValidationErrorCode } from '@/libs/error/error.codes';
import { ErrorCategory, ErrorService } from '@/libs/error/error.types';
import type { Pubky } from '@/models/models.types';
import { FeedNormalizer } from '@/pipes/feed/feed.normalizer';
import { PubkySpecsSingleton } from '@/pipes/pipes.builder';
import { asOpaque } from '@/test-utils/type-assertions';

describe('FeedNormalizer', () => {
  const testData = {
    userPubky: 'pxnu33x7jtpx9ar1ytsi4yxbp6a5o36gwhffs8zoxmbuptici1jy' as Pubky,
    feedName: 'Bitcoin News',
    tags: ['bitcoin', 'lightning'],
  };

  // Mock builder factory
  const createMockBuilder = () => ({
    createFeed: vi.fn(
      (input: {
        tags?: string[];
        reach: string;
        layout: string;
        sort: string;
        content?: string;
        name: string;
        icon: string;
      }) => {
        const mockFeed = {
          name: input.name,
          icon: input.icon,
          feed: {
            tags: input.tags,
            reach: PubkyAppFeedReach.All,
            layout: 0,
            sort: PubkyAppFeedSort.Recent,
            content: input.content ? PubkyAppPostKind.Short : null,
          },
          toJson: vi.fn(() => input),
        };
        return asOpaque<FeedResult>({
          feed: mockFeed,
          meta: {
            id: 'feed123',
            url: `pubky://${testData.userPubky}/pub/pubky.app/feeds/feed123`,
            path: '/pub/pubky.app/feeds/feed123',
          },
        });
      },
    ),
  });

  let mockBuilder: ReturnType<typeof createMockBuilder>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBuilder = createMockBuilder();
    vi.spyOn(PubkySpecsSingleton, 'get').mockReturnValue(asOpaque<PubkySpecsBuilder>(mockBuilder));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('to', () => {
    const createValidParams = (): TFeedCreateParams => ({
      name: testData.feedName,
      icon: 'activity',
      tags: testData.tags,
      reach: PubkyAppFeedReach.All,
      sort: PubkyAppFeedSort.Recent,
      content: null,
      layout: PubkyAppFeedLayout.Columns,
    });

    it('should create feed using builder with correct parameters', () => {
      const params = createValidParams();

      const result = FeedNormalizer.to({ params, userId: testData.userPubky });

      expect(mockBuilder.createFeed).toHaveBeenCalledWith({
        tags: ['bitcoin', 'lightning'],
        reach: 'all',
        layout: 'columns',
        sort: 'recent',
        content: undefined,
        name: testData.feedName,
        icon: 'activity',
      });
      expect(result).toBeTruthy();
    });

    it('should normalize tags to lowercase', () => {
      const params = createValidParams();
      params.tags = ['BITCOIN', 'Lightning', 'TECH'];

      FeedNormalizer.to({ params, userId: testData.userPubky });

      expect(mockBuilder.createFeed).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['bitcoin', 'lightning', 'tech'] }),
      );
    });

    it('should trim whitespace from tags', () => {
      const params = createValidParams();
      params.tags = ['  bitcoin  ', ' lightning '];

      FeedNormalizer.to({ params, userId: testData.userPubky });

      expect(mockBuilder.createFeed).toHaveBeenCalledWith(expect.objectContaining({ tags: ['bitcoin', 'lightning'] }));
    });

    it('should deduplicate tags', () => {
      const params = createValidParams();
      params.tags = ['bitcoin', 'BITCOIN', 'Bitcoin'];

      FeedNormalizer.to({ params, userId: testData.userPubky });

      expect(mockBuilder.createFeed).toHaveBeenCalledWith(expect.objectContaining({ tags: ['bitcoin'] }));
    });

    it('should trim feed name', () => {
      const params = createValidParams();
      params.name = '  Bitcoin News  ';

      FeedNormalizer.to({ params, userId: testData.userPubky });

      expect(mockBuilder.createFeed).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bitcoin News' }));
    });

    it('should convert reach enum to string', () => {
      const params = createValidParams();
      params.reach = PubkyAppFeedReach.Following;

      FeedNormalizer.to({ params, userId: testData.userPubky });

      expect(mockBuilder.createFeed).toHaveBeenCalledWith(expect.objectContaining({ reach: 'following' }));
    });

    it('should convert sort enum to string', () => {
      const params = createValidParams();
      params.sort = PubkyAppFeedSort.Popularity;

      FeedNormalizer.to({ params, userId: testData.userPubky });

      expect(mockBuilder.createFeed).toHaveBeenCalledWith(expect.objectContaining({ sort: 'popularity' }));
    });

    it('should convert content enum to string when specified', () => {
      const params = createValidParams();
      params.content = PubkyAppPostKind.Image;

      FeedNormalizer.to({ params, userId: testData.userPubky });

      expect(mockBuilder.createFeed).toHaveBeenCalledWith(expect.objectContaining({ content: 'image' }));
    });

    it('should pass null content when All is selected', () => {
      const params = createValidParams();
      params.content = null;

      FeedNormalizer.to({ params, userId: testData.userPubky });

      expect(mockBuilder.createFeed).toHaveBeenCalledWith(expect.objectContaining({ content: undefined }));
    });

    describe('tag normalization', () => {
      it('should normalize empty tags array to empty array', () => {
        const params = createValidParams();
        params.tags = [];

        const result = FeedNormalizer.to({ params, userId: testData.userPubky });

        expect(mockBuilder.createFeed).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: [],
            reach: 'all',
            layout: 'columns',
            sort: 'recent',
            content: undefined,
            name: testData.feedName,
          }),
        );
        expect(result).toBeTruthy();
      });

      it('should normalize tags with whitespace', () => {
        const params = createValidParams();
        params.tags = ['  BITCOIN  ', '  Lightning  ', 'TECH'];

        FeedNormalizer.to({ params, userId: testData.userPubky });

        expect(mockBuilder.createFeed).toHaveBeenCalledWith(
          expect.objectContaining({ tags: ['bitcoin', 'lightning', 'tech'] }),
        );
      });

      it('should deduplicate tags', () => {
        const params = createValidParams();
        params.tags = ['bitcoin', 'Bitcoin', 'BITCOIN', 'lightning'];

        FeedNormalizer.to({ params, userId: testData.userPubky });

        expect(mockBuilder.createFeed).toHaveBeenCalledWith(
          expect.objectContaining({ tags: ['bitcoin', 'lightning'] }),
        );
      });

      it('should filter out empty tags after trimming', () => {
        const params = createValidParams();
        params.tags = ['bitcoin', '   ', 'lightning', ''];

        FeedNormalizer.to({ params, userId: testData.userPubky });

        expect(mockBuilder.createFeed).toHaveBeenCalledWith(
          expect.objectContaining({ tags: ['bitcoin', 'lightning'] }),
        );
      });
    });

    it('should throw AppError with correct properties when builder fails', () => {
      const params = createValidParams();
      const errorMessage = 'Invalid feed configuration';
      mockBuilder.createFeed.mockImplementation(() => {
        throw errorMessage;
      });

      try {
        FeedNormalizer.to({ params, userId: testData.userPubky });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        const appError = error as AppError;
        expect(appError.category).toBe(ErrorCategory.Validation);
        expect(appError.code).toBe(ValidationErrorCode.INVALID_INPUT);
        expect(appError.service).toBe(ErrorService.PubkyAppSpecs);
        expect(appError.operation).toBe('createFeed');
        expect(appError.context).toEqual({ params, userId: testData.userPubky });
        expect(appError.message).toBe(errorMessage);
      }
    });
  });
});
