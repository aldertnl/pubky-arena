import { TPostStreamChunkResponse } from '../post.types';

export type FetchResult = TPostStreamChunkResponse;
export type FetchFn = (cursor: number) => Promise<FetchResult>;
export type FilterFn = (posts: string[]) => string[] | Promise<string[]>;

export interface CollectParams {
  limit: number;
  cursor: number;
  filter: FilterFn;
  fetch: FetchFn;
}

export interface CollectResult {
  posts: string[];
  cacheMissIds: string[];
  /** Opaque resume cursor: raw `skip` offset for skip streams, `last_post_score` for
   * score streams. Advanced only by raw backend data, never by post-filter count. */
  nextCursor: number | undefined;
  /** True only if Nexus returned fewer posts than limit (actual end of stream).
   * False if we hit MAX_FETCH_ITERATIONS or filled the limit. */
  reachedEnd: boolean;
}
