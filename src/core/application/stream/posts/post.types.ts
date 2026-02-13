import * as Core from '@/core';

export interface TFetchStreamParams {
  streamId: Core.PostStreamId;
  streamHead: number;
  streamTail: number;
  limit: number;
  /** Optional viewer ID for relationship data. Null for unauthenticated views. */
  viewerId: Core.Pubky | null;
  lastPostId?: string;
  tags?: string[];
  order?: Core.StreamOrder;
}

/**
 * Info about a plain repost identified by the Core layer.
 * A plain repost has no content and no attachments.
 */
export interface PlainRepostInfo {
  /** Composite ID of the original post (author:postId) */
  originalPostId: string;
  /** Timestamp of the repost (indexed_at) */
  indexedAt: number;
}

export interface TPostStreamChunkResponse {
  nextPageIds: string[];
  cacheMissPostIds: string[];
  timestamp: number | undefined;
  /** True only if we've reached the actual end of the stream (Nexus returned fewer posts than limit).
   * False if we hit MAX_FETCH_ITERATIONS or filled the limit. */
  reachedEnd?: boolean;
  /**
   * Mapping of plain repost IDs to their original post info.
   * UI uses this to display the original post with a grouped repost header,
   * while keeping the repost ID in postIds for operations (delete, prepend, remove).
   */
  plainRepostOriginals: Map<string, PlainRepostInfo>;
}

export interface TPartialCacheHitParams {
  cachedStreamChunk: string[];
  limit: number;
  streamTail: number;
  streamId: Core.PostStreamId;
  /** Optional viewer ID for relationship data. Null for unauthenticated views. */
  viewerId: Core.Pubky | null;
}

export interface TMissingPostsParams {
  cacheMissPostIds: string[];
  /** Optional viewer ID for relationship data. Null/undefined for unauthenticated views. */
  viewerId?: Core.Pubky | null;
}

export interface TCacheStreamParams {
  lastPostId: string | undefined;
  limit: number;
  cachedStream: { stream: string[] };
}

export interface TFetchMissingUsersParams {
  posts: Core.NexusPost[];
  /** Optional viewer ID for relationship data. Null/undefined for unauthenticated views. */
  viewerId?: Core.Pubky | null;
}

export interface TPersistUnreadNewStreamChunkParams {
  streamId: Core.PostStreamId;
  compositePostIds: string[];
}

/**
 * Entry stored in the in-memory queue for overflow posts between pagination requests.
 * @property posts - Array of composite post IDs (authorPubky:postId) not yet returned to UI
 * @property cursor - The last timestamp used for pagination
 */
export interface TQueueEntry {
  posts: string[];
  cursor: number;
}
