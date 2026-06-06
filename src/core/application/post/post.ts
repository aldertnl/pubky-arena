import { postUriBuilder } from 'pubky-app-specs';
import { FileApplication } from '@/application/file/file';
import type { EnrichedPostDetails } from '@/application/moderation/moderation.types';
import type {
  TCreatePostInput,
  TEditPostInput,
  TGetOrFetchPostParams,
  TVerifyExistsOnHomeserverParams,
  TVerifyAllOnHomeserverParams,
  TResolveHomeserverVerificationUrisParams,
  TResolveHomeserverVerificationUrisResult,
} from '@/application/post/post.types';
import { PostStreamApplication } from '@/application/stream/posts/post';
import { TagApplication } from '@/application/tag/tag';
import { ModerationController } from '@/controllers/moderation/moderation';
import type {
  TDeletePostParams,
  TFetchMorePostTagsParams,
  TFetchPostTaggersParams,
} from '@/controllers/post/post.types';
import { ClientErrorCode } from '@/libs/error/error.codes';
import { Err } from '@/libs/error/error.factories';
import { ErrorService } from '@/libs/error/error.types';
import { HttpMethod } from '@/libs/http/http.types';
import { Logger } from '@/libs/logger/logger';
import { CompositeIdDomain } from '@/models/models.types';
import { buildCompositeIdFromPubkyUri, parseCompositeId } from '@/models/models.utils';
import type { PostCountsModelSchema } from '@/models/post/counts/postCounts.schema';
import { PostDetailsModel } from '@/models/post/details/postDetails';
import type { PostDetailsModelSchema } from '@/models/post/details/postDetails.schema';
import type { PostRelationshipsModelSchema } from '@/models/post/relationships/postRelationships.schema';
import type { TagCollectionModelSchema } from '@/models/shared/tag/tag.schema';
import { HomeserverService } from '@/services/homeserver/homeserver';
import { LocalFileService } from '@/services/local/file/file';
import { LocalPostService } from '@/services/local/post/post';
import { LocalPostTagService } from '@/services/local/tag/post/tag.post';
import type { NexusTag, NexusTaggers } from '@/services/nexus/nexus.types';
import { NexusPostService } from '@/services/nexus/post/post';
import type { TCompositeId } from '@/services/nexus/post/post.types';

export class PostApplication {
  private static readonly homeserverVerificationCache = new Map<string, boolean>();
  private static readonly homeserverGetInflight = new Map<string, Promise<Response>>();
  private static readonly compositeVerificationInflight = new Map<string, Promise<boolean>>();

  /**
   * Reads post details from local database and enriches with moderation state
   * @param compositeId - Composite post ID in format "authorId:postId"
   * @returns Post details with moderation state or null if not found
   */
  static async getDetails({ compositeId }: TCompositeId): Promise<EnrichedPostDetails | null> {
    const post = await LocalPostService.readDetails({ postId: compositeId });
    if (!post) return null;
    const [enriched] = await ModerationController.enrichPosts([post]);
    return enriched;
  }

  /**
   * Reads post counts for a specific post
   * @param compositeId - Composite post ID in format "authorId:postId"
   * @returns Post counts or null if not found
   */
  static async getCounts({ compositeId }: TCompositeId): Promise<PostCountsModelSchema | null> {
    return await LocalPostService.readCounts(compositeId);
  }

  /**
   * Reads post tags for a specific post from local database
   * @param compositeId - Composite post ID in format "authorId:postId"
   * @returns Post tags
   */
  static async getTags({ compositeId }: TCompositeId): Promise<TagCollectionModelSchema<string>[]> {
    return await LocalPostService.readTags(compositeId);
  }

  /**
   * Reads post relationships for a specific post
   * @param compositeId - Composite post ID in format "authorId:postId"
   * @returns Post relationships or null if not found
   */
  static async getRelationships({ compositeId }: TCompositeId): Promise<PostRelationshipsModelSchema | null> {
    return await LocalPostService.readRelationships(compositeId);
  }

  /**
   * Reads all posts that are replies to a specific post
   * @param compositeId - Composite post ID to read replies for
   * @returns Array of post relationships that replied to this post
   */
  static async getReplies({ compositeId }: TCompositeId): Promise<PostRelationshipsModelSchema[]> {
    const { pubky, id } = parseCompositeId(compositeId);
    const parentPostUri = postUriBuilder(pubky, id);
    return await LocalPostService.readReplies(parentPostUri);
  }

  /**
   * Fetch more post tags from Nexus with pagination and persist to local DB
   * @param compositeId - Composite post ID in format "authorId:postId"
   * @param skip - Number of tags to skip
   * @param limit - Maximum number of tags to return
   * @returns Array of tags from Nexus
   */
  static async fetchTags({ compositeId, skip, limit, viewerId }: TFetchMorePostTagsParams): Promise<NexusTag[]> {
    const nexusTags = await NexusPostService.getPostTags({ compositeId, skip, limit, viewerId });

    // Persist new tags to local DB (merge with existing)
    if (nexusTags.length > 0) {
      await LocalPostTagService.mergeTags({ postId: compositeId, tags: nexusTags, viewerId: viewerId ?? null });
    }

    return nexusTags;
  }

  /**
   * Fetch taggers for a specific tag label on a post from Nexus API
   * @param params - Parameters containing composite post ID, label, and pagination options
   * @returns Tagger payload for the label ({ users, relationship })
   */
  static async fetchTaggers(params: TFetchPostTaggersParams): Promise<NexusTaggers> {
    return await NexusPostService.getPostTaggers(params);
  }

  /**
   * Reads or fetches a full post entity from local database.
   * If not found locally, fetches from Nexus and persists everything (details, counts, relationships, tags, author).
   * @param compositeId - Composite post ID in format "authorId:postId"
   * @param viewerId - Optional viewer ID for relationship data
   * @returns Post details or null if not found
   */
  static async getOrFetch({ compositeId, viewerId }: TGetOrFetchPostParams): Promise<PostDetailsModelSchema | null> {
    const localPost = await LocalPostService.readDetails({ postId: compositeId });
    if (localPost) return localPost;

    // Reuse stream posts logic to fetch and persist single post
    await PostStreamApplication.fetchMissingPostsFromNexus({
      cacheMissPostIds: [compositeId],
      viewerId,
    });

    // Return the persisted post details
    return await LocalPostService.readDetails({ postId: compositeId });
  }

  /**
   * Fetches a post from Nexus and persists to local database (network-only, no local read).
   * Use this instead of `getOrFetch` when the caller already knows the post is not in
   * local DB (e.g. `useLocalFirstQuery` hook where `useLiveQuery` handles the local read).
   * @param compositeId - Composite post ID in format "authorId:postId"
   * @param viewerId - Optional viewer ID for relationship data
   * @returns Post details or null if not found on Nexus
   */
  static async fetch({ compositeId, viewerId }: TGetOrFetchPostParams): Promise<PostDetailsModelSchema | null> {
    await PostStreamApplication.fetchMissingPostsFromNexus({
      cacheMissPostIds: [compositeId],
      viewerId,
    });

    return await LocalPostService.readDetails({ postId: compositeId });
  }

  /**
   * Checks whether a resource exists on the author's homeserver.
   * Uses GET without throwing on 404 — verification is a soft check.
   */
  static async verifyExistsOnHomeserver({ postUri }: TVerifyExistsOnHomeserverParams): Promise<boolean> {
    const cached = this.homeserverVerificationCache.get(postUri);
    if (cached !== undefined) return cached;

    try {
      const response = await this.getHomeserverResource(postUri);
      const verified = response.ok;
      this.homeserverVerificationCache.set(postUri, verified);
      return verified;
    } catch (error) {
      Logger.warn('[PostApplication.verifyExistsOnHomeserver] Verification failed', { postUri, error });
      this.homeserverVerificationCache.set(postUri, false);
      return false;
    }
  }

  /** Clears in-memory homeserver verification cache (for tests). */
  static clearHomeserverVerificationCache(): void {
    this.homeserverVerificationCache.clear();
    this.homeserverGetInflight.clear();
    this.compositeVerificationInflight.clear();
  }

  /**
   * Deduplicates concurrent homeserver GETs for the same URI during verification.
   */
  private static getHomeserverResource(uri: string): Promise<Response> {
    const inflight = this.homeserverGetInflight.get(uri);
    if (inflight) return inflight;

    const promise = HomeserverService.get(uri).finally(() => {
      this.homeserverGetInflight.delete(uri);
    });

    this.homeserverGetInflight.set(uri, promise);
    return promise;
  }

  /**
   * Verifies that every homeserver resource URI exists (post JSON, file metadata, and blobs).
   */
  static async verifyAllExistOnHomeserver({ uris }: TVerifyAllOnHomeserverParams): Promise<boolean> {
    if (uris.length === 0) return false;

    const results = await Promise.all(uris.map((postUri) => this.verifyExistsOnHomeserver({ postUri })));
    return results.every(Boolean);
  }

  /**
   * Resolves homeserver URIs to verify for attachments and blobs.
   * The post JSON is fetched once here; it is not re-fetched in a later pass.
   */
  static async resolveHomeserverVerificationUris({
    postUri,
    localAttachments,
  }: TResolveHomeserverVerificationUrisParams): Promise<TResolveHomeserverVerificationUrisResult> {
    const urisToVerify = new Set<string>();
    let attachmentUris = localAttachments?.filter(Boolean) ?? [];

    const postResponse = await this.getHomeserverResource(postUri);
    const postVerified = postResponse.ok;
    this.homeserverVerificationCache.set(postUri, postVerified);

    if (!postVerified) {
      return { postUri, postVerified: false, urisToVerify: [] };
    }

    try {
      const postJson = (await postResponse.json()) as { attachments?: string[] | null };
      if (postJson.attachments?.length) {
        attachmentUris = postJson.attachments;
      }
    } catch (error) {
      Logger.warn('[PostApplication.resolveHomeserverVerificationUris] Failed to parse post JSON', {
        postUri,
        error,
      });
    }

    await Promise.all(
      attachmentUris.map(async (fileUri) => {
        const blobUri = await this.resolveFileBlobUri({ fileUri });
        urisToVerify.add(fileUri);
        if (blobUri) urisToVerify.add(blobUri);
      }),
    );

    return { postUri, postVerified: true, urisToVerify: [...urisToVerify] };
  }

  /**
   * Verifies a post and all of its attachments on the homeserver (deduplicated per composite ID).
   */
  static async verifyPostOnHomeserver({ compositeId }: TCompositeId): Promise<boolean> {
    if (!this.compositeVerificationInflight.has(compositeId)) {
      const promise = this.doVerifyPostOnHomeserver({ compositeId }).finally(() => {
        this.compositeVerificationInflight.delete(compositeId);
      });
      this.compositeVerificationInflight.set(compositeId, promise);
    }

    return this.compositeVerificationInflight.get(compositeId)!;
  }

  private static async doVerifyPostOnHomeserver({ compositeId }: TCompositeId): Promise<boolean> {
    const details = await this.getDetails({ compositeId });
    const { pubky, id } = parseCompositeId(compositeId);
    const postUri = details?.uri ?? postUriBuilder(pubky, id);

    const { postVerified, urisToVerify } = await this.resolveHomeserverVerificationUris({
      postUri,
      localAttachments: details?.attachments ?? null,
    });

    if (!postVerified) return false;
    if (urisToVerify.length === 0) return true;

    return this.verifyAllExistOnHomeserver({ uris: urisToVerify });
  }

  private static async resolveFileBlobUri({ fileUri }: { fileUri: string }): Promise<string | null> {
    const compositeId = buildCompositeIdFromPubkyUri({ uri: fileUri, domain: CompositeIdDomain.FILES });
    if (compositeId) {
      const localFile = await LocalFileService.read(compositeId);
      if (localFile?.src) return localFile.src;
    }

    try {
      const response = await this.getHomeserverResource(fileUri);
      this.homeserverVerificationCache.set(fileUri, response.ok);

      if (!response.ok) return null;

      const fileJson = (await response.json()) as { src?: string };
      return fileJson.src ?? null;
    } catch (error) {
      Logger.warn('[PostApplication.resolveFileBlobUri] Failed to parse file JSON', { fileUri, error });
      this.homeserverVerificationCache.set(fileUri, false);
      return null;
    }
  }

  static async commitCreate({ postUrl, compositePostId, post, fileAttachments, tags }: TCreatePostInput) {
    const hasFiles = fileAttachments != null && fileAttachments.length > 0;

    if (hasFiles) {
      await FileApplication.commitCreate({ fileAttachments });
    }
    await LocalPostService.create({ compositePostId, post });

    try {
      await HomeserverService.request({ method: HttpMethod.PUT, url: postUrl, bodyJson: post.toJson() });
    } catch (error) {
      try {
        await LocalPostService.delete({ compositePostId });
      } catch (rollbackError) {
        Logger.error('[PostApplication.commitCreate] Failed to rollback local post create', {
          compositePostId,
          rollbackError,
        });
      }

      if (hasFiles) {
        try {
          const fileUris = fileAttachments.map((f) => f.fileResult.meta.url);
          await FileApplication.commitDelete(fileUris);
        } catch (fileRollbackError) {
          Logger.error('[PostApplication.commitCreate] Failed to rollback file attachments', {
            compositePostId,
            fileRollbackError,
          });
        }
      }

      throw error;
    }

    if (tags && tags.length > 0) {
      await TagApplication.commitCreate({ tagList: tags });
    }
  }

  static async commitDelete({ compositePostId }: TDeletePostParams) {
    const post = await PostDetailsModel.findById(compositePostId);

    if (!post) {
      throw Err.client(ClientErrorCode.NOT_FOUND, 'Post not found', {
        service: ErrorService.Local,
        operation: 'commitDelete',
        context: { compositePostId },
      });
    }
    const hadConnections = await LocalPostService.delete({ compositePostId });

    // Always delete from homeserver, even if the post had connections (soft delete).
    // Nexus will determine the definitive state based on graph state.
    const postUrl = post.uri;
    await HomeserverService.request({ method: HttpMethod.DELETE, url: postUrl });

    if (!hadConnections && post.attachments && post.attachments.length > 0) {
      await FileApplication.commitDelete(post.attachments);
    }
  }

  static async commitEdit({ compositePostId, post, postUrl }: TEditPostInput) {
    const originalPost = await LocalPostService.readDetails({ postId: compositePostId });
    await LocalPostService.edit({ compositePostId, content: post.content });

    try {
      await HomeserverService.request({ method: HttpMethod.PUT, url: postUrl, bodyJson: post.toJson() });
    } catch (error) {
      if (originalPost) {
        try {
          await LocalPostService.edit({ compositePostId, content: originalPost.content });
        } catch (rollbackError) {
          Logger.error('[PostApplication.commitEdit] Failed to rollback local post edit', {
            compositePostId,
            rollbackError,
          });
        }
      }
      throw error;
    }
  }
}
