# [BUG] Unsupported notification pages can poison pagination with NaN

**File:** [`src/core/application/notification/notification.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/application/notification/notification.ts#L289-L337) (lines 289, 290, 293, 333, 337)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-pagination-bug`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

NotificationApplication.toSupportedFlatNotifications filters unsupported Nexus notification types, but fetchFromNexus calculates the next pagination cursor from the filtered flatNotifications array. If Nexus returns a non-empty page containing only unsupported types, flatNotifications is empty, nextOlderThan is undefined, and the method returns olderThan as NaN. Callers treat any non-undefined cursor as another page, so the UI can pass NaN into the local IndexedDB query or Nexus start parameter, breaking notification pagination/loading. The code comment explicitly notes unsupported server types such as lost_friend, so this is a realistic compatibility edge case.

## Recommendation

Derive the next cursor from the raw Nexus page before filtering, e.g. from notifications[notifications.length - 1].timestamp, and only return undefined when the raw page is empty. Add a regression test for a page containing only unsupported notification types.

## Revalidation

**Verdict:** true-positive

NotificationApplication.fetchFromNexus first fetches a raw Nexus page and only returns olderThan undefined when the raw notifications array is empty. For non-empty pages it calls fetchMissingEntities, which calls toSupportedFlatNotifications and filters out bodies whose type is not in the local NotificationType enum. If the raw page contains only unsupported server notification types, flatNotifications is empty even though notifications.length is non-zero. The code then calculates nextOlderThan from flatNotifications[flatNotifications.length - 1]?.timestamp, which is undefined in that case, and returns olderThan as nextOlderThan - 1. In JavaScript that expression produces NaN, not undefined. useNotifications treats olderThan !== undefined as hasMore, stores NaN in olderThanRef, and passes it into the next NotificationController.getOrFetchNotifications call. That can flow into Dexie as table.where('timestamp').below(NaN), or into the Nexus query URL as start=NaN because buildUrlWithQuery stringifies query parameter values. The code comment explicitly names unsupported server types such as lost_friend, so an unsupported-only page is a realistic compatibility case rather than a purely theoretical malformed response.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-07-01)
- V <jovanovicv90@gmail.com> (2026-05-05)
- Taehwa Kim <hadeath03@gmail.com> (2026-05-04)
