import * as Core from '@/core';
import * as Config from '@/config';

/**
 * Stream User Controller
 *
 * Handles user stream requests from the UI layer.
 * Coordinates between application layer and manages background data fetching.
 * Supports followers, following, friends, and other user stream types.
 */
export class StreamUserController {
  private constructor() {}

  /**
   * Reads MUTED users from homeserver (source of truth), persists via MuteApplication,
   * and paginates the refreshed local stream.
   *
   * @param viewerId - The ID of the viewer
   * @param limit - The number of users to return
   * @param skip - The number of users to skip
   * @returns The next page of user IDs and pagination offset
   */
  private static async getOrFetchMutedStreamSlice({
    viewerId,
    limit = Config.NEXUS_USERS_PER_PAGE,
    skip = 0,
  }: {
    viewerId?: Core.Pubky;
    limit?: number;
    skip?: number;
  }): Promise<Core.TReadUserStreamChunkResponse> {
    if (!viewerId) {
      return { nextPageIds: [], skip: undefined };
    }

    const mutedUserIds = await Core.MuteController.fetchMutedUsers(viewerId);
    const nextPageIds = mutedUserIds.slice(skip, skip + limit);
    const nextSkip = nextPageIds.length > 0 ? skip + nextPageIds.length : undefined;

    if (nextPageIds.length > 0) {
      await Core.UserStreamApplication.getOrFetchUsers({
        userIds: nextPageIds,
        viewerId,
      });
    }

    return { nextPageIds, skip: nextSkip };
  }

  /**
   * Get or fetch a slice of a user stream (followers, following, friends, etc.)
   *
   * @param streamId - Composite user stream identifier (userId:reach) e.g., 'user123:followers'
   * @param skip - Number of users to skip (for pagination)
   * @param limit - Number of users to return
   * @returns Next page of user IDs and pagination offset
   */
  static async getOrFetchStreamSlice({
    streamId,
    limit = Config.NEXUS_USERS_PER_PAGE,
    skip,
  }: Core.TReadUserStreamChunkParams): Promise<Core.TReadUserStreamChunkResponse> {
    // selectCurrentUserPubky() throws an error when user is not authenticated;
    // access currentUserPubky directly to get null instead (unauthenticated users can view profile followers/following)
    const viewerId = Core.useAuthStore.getState().currentUserPubky;

    if (streamId === Core.UserStreamTypes.MUTED) {
      return await this.getOrFetchMutedStreamSlice({
        viewerId: viewerId ?? undefined,
        limit,
        skip,
      });
    }

    const {
      nextPageIds,
      cacheMissUserIds,
      skip: nextSkip,
    } = await Core.UserStreamApplication.getOrFetchStreamSlice({
      streamId,
      skip,
      limit,
      viewerId: viewerId ?? undefined,
    });

    // Background fetch for missing users (non-blocking)
    if (cacheMissUserIds.length > 0) {
      // TODO: When TTL is implemented, we can return to void
      await Core.UserStreamApplication.fetchMissingUsersFromNexus({
        cacheMissUserIds,
        viewerId: viewerId ?? undefined,
      });
    }

    return { nextPageIds, skip: nextSkip };
  }

  /**
   * Ensures user details are cached for the given IDs.
   * Checks local cache and fetches any missing users from Nexus.
   *
   * @param userIds - Array of user IDs to ensure are cached
   */
  static async getOrFetchUsers({ userIds }: Pick<Core.TGetOrFetchUsersParams, 'userIds'>): Promise<void> {
    const viewerId = Core.useAuthStore.getState().currentUserPubky;

    await Core.UserStreamApplication.getOrFetchUsers({
      userIds,
      viewerId: viewerId ?? undefined,
    });
  }
}
