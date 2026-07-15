# [BUG] Malformed notifications can emit invalid related user IDs

**File:** [`src/core/services/local/notification/notification.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/services/local/notification/notification.ts#L68-L95) (lines 68, 72, 75, 79, 83, 87, 91, 95)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-logic-bug`

## Owners

**Suggested assignee:** `hadeath03@gmail.com` _(via last-committer)_

## Finding

parseNotifications trusts actor fields such as followed_by, tagged_by, replied_by, and deleted_by and adds them directly to relatedUserIds. Runtime notifications are built from Nexus body data and only the notification type is filtered elsewhere, so a supported-type notification with a missing or non-string actor field can push undefined or invalid IDs into downstream cache lookups and Nexus batch fetches, breaking notification hydration or polling.

## Recommendation

Validate each flattened notification shape before saving/parsing, or guard each related user insertion with a non-empty string/Pubky check and skip malformed references with a warning.

## Revalidation

**Verdict:** true-positive

The target parseNotifications implementation still adds actor fields such as followed_by, tagged_by, replied_by, and deleted_by directly to relatedUserIds without checking type or non-emptiness. NexusNotification.body is typed as Record<string, unknown>, and NotificationNormalizer.toFlatNotification spreads that body into a FlatNotification via a type assertion, so TypeScript does not provide runtime validation. NotificationApplication.toSupportedFlatNotifications only filters by supported notification type after flattening. NotificationModel.bulkSave filters only for id, timestamp, and type, and the id generation can stringify undefined actor fields into business keys such as follow:timestamp:undefined. The parsed relatedUserIds are passed to LocalStreamUsersService.getNotPersistedUsersInCache and then potentially to UserStreamApplication.fetchMissingUsersFromNexus, so undefined or non-string values can flow into Dexie bulkGet or Nexus by_ids requests. Post URIs get a small guard through addPostUri, but actor IDs do not receive an equivalent guard. Exploitability as an attacker-controlled security issue depends on whether Nexus can be induced to emit malformed supported notification bodies, which is outside this repo, but the local robustness bug is real.

## Recent committers (`git log`)

- Taehwa Kim <hadeath03@gmail.com> (2026-05-04)
- V <jovanovicv90@gmail.com> (2026-04-29)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-02-19)
- Miguel Medeiros <miguel@miguelmedeiros.com.br> (2025-12-02)
