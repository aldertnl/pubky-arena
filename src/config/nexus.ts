import { getCdnUrl, getNexusUrl, getStreamCacheMaxAgeMs } from '@/libs/runtime-config/runtime-config';

// Runtime-configurable: read via getters at call time (PUBKY_RUNTIME_*, staging defaults in
// dev/test). See @/libs/runtime-config.
export { getCdnUrl, getNexusUrl, getStreamCacheMaxAgeMs };

export const NEXUS_NOTIFICATIONS_LIMIT = 30;
export const NEXUS_POSTS_PER_PAGE = 10; // Number of posts to fetch per page in streams
export const NEXUS_STREAM_MAX_LIMIT = 50; // Hard cap Nexus enforces on a single stream `limit`; requests above this are rejected
export const NEXUS_USERS_PER_PAGE = 10; // Number of users to fetch per page in streams

/**
 * Nexus contract limit: `source=starter_pack` accepts 1-5 comma-separated interest tags
 * (pubky/pubky-nexus#1024). Fixed by the backend — independent of the runtime-configurable
 * `getMaxStreamTags()`, which may be set higher and must never widen this bound.
 */
export const STARTER_PACK_MAX_TAGS = 5;

/**
 * TEMPORARY — remove in pubky/pubky-app#2390.
 * pubky/pubky-nexus#1024 is merged but not yet deployed to staging. While false,
 * `buildStarterPackStreamId` emits a `starter_pack_mock:*` cache namespace that dispatches to
 * `most_followed` (`recommended` returns nothing for brand-new accounts, pubky/pubky-nexus#1022).
 * Flipping to true changes every starter pack cache key, so the first live load is a guaranteed
 * cache miss and stale mock rows can never satisfy live requests.
 */
export const STARTER_PACK_SOURCE_LIVE = false;
