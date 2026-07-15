# [MEDIUM] In-flight notification poll can write previous user's notifications after auth cleanup

**File:** [`src/core/coordinators/notifications/notifications.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/coordinators/notifications/notifications.ts#L94-L99) (lines 94, 99)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `other-cross-user-cache`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

poll captures the current userId and awaits NotificationController.fetchNotifications without an abort or post-await current-user check. Downstream code fetches that user's Nexus notifications, persists them to IndexedDB, and updates the unread store. Auth cleanup resets the coordinator, stores, and database, but an already-started poll can still complete afterward and repopulate notification data for the previous account. On a shared browser this can expose stale notification metadata/counts to the next signed-in user.

## Recommendation

Capture a polling epoch and expected Pubky for each poll, abort in-flight Nexus work on stop/logout, and verify the epoch/current user before persisting notifications or updating stores.

## Revalidation

**Verdict:** true-positive

The notification coordinator captures `userId` from the auth store and then awaits `NotificationController.fetchNotifications({ userId })` without an epoch, AbortSignal, or post-await current-user check. The base coordinator only clears future intervals in `stopPolling`; it does not cancel an already-running `poll()` promise. The controller passes the captured user to `NotificationApplication.fetchNotifications`, which calls Nexus for that user's notifications, fetches related post/user entities with that viewer id, and persists flat notifications through `LocalNotificationService.bulkSave`. After the application returns, the controller also updates the persisted notification store's unread count and polling cursor without rechecking whether the same account is still active. Auth cleanup resets the coordinator singleton, clears stores, and clears Dexie, but an old promise from the destroyed coordinator can still complete afterward. A shared-browser race therefore lets user A's in-flight poll finish after logout or B sign-in and repopulate local notification rows and unread state for A. The notification table and store are not scoped by owner in this path, so the next account can observe stale notification metadata/counts.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- tipogi <103417381+tipogi@users.noreply.github.com> (2025-12-16)
