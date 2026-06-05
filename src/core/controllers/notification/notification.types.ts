/**
 * Parameters for timestamp-based notification pagination in controller.
 *
 * @property olderThan - Unix timestamp to get notifications older than.
 *                       Defaults to Infinity for initial load (most recent notifications).
 *                       Use the timestamp of the last notification for pagination.
 * @property limit - Optional maximum number of notifications to return.
 *                   Defaults to NEXUS_NOTIFICATIONS_LIMIT.
 */
export type TGetNotificationsParams = {
  olderThan?: number;
  limit?: number;
};

/**
 * Event emitted by the homeserver event stream for changes to the `last_read` file.
 *
 * `eventType` is narrowed to the only values the pubky SDK emits for a single-file path
 * (`"PUT" | "DEL"`, per the SDK docstring at `@synonymdev/pubky` `eventStreamForUser`).
 * The upstream {@link THomeserverUserEvent} types it loosely as `string` for forward
 * compatibility; the controller casts at the boundary when narrowing for this domain.
 */
export type TLastReadEvent = {
  cursor: string;
  eventType: 'PUT' | 'DEL';
};
