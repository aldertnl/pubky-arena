# [BUG] Unblurred moderation records can be re-blurred by later cache refreshes

**File:** [`src/core/services/local/moderation/moderation.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/services/local/moderation/moderation.ts#L15-L19) (lines 15, 19)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-state-regression`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

setUnBlur only flips the current moderation row to is_blurred=false. Related ingestion paths for posts and users create moderation rows with is_blurred=true whenever Nexus tags mark content as moderated, and bulk-save those rows. A later TTL refresh or stream persistence can therefore overwrite a user's local unblur choice and make the same item blurred again.

## Recommendation

When persisting moderation records from Nexus, merge with any existing row and preserve is_blurred=false for items the user has already unblurred. Alternatively store user unblur decisions separately from moderation detection records.

## Revalidation

**Verdict:** true-positive

The checked-out HEAD is 1b29a961c0c756c6e7064def7dac3b63f03915df, matching the requested target. `LocalModerationService.setUnBlur` only updates the existing moderation row to `is_blurred: false`; it does not record the user preference separately. `LocalStreamPostsService.persistPosts` creates moderation rows with `is_blurred: true` when Nexus tags match moderation rules, and `LocalStreamUsersService.persistUsers` does the same for profiles. `ModerationModel.bulkSave` delegates to `RecordModelBase.bulkSave`, which is Dexie `bulkPut`, so it replaces the full row rather than merging with an existing unblurred row. `ModerationApplication.enrichPostsWithModeration`, `enrichUsersWithModeration`, and `getModerationStatus` read that same field to decide whether the UI should blur the item. A concrete scenario is: the user unblurs a moderated post or profile, then a TTL refresh, stream persistence, or missing-entity fetch ingests the same Nexus object and overwrites the moderation row back to blurred. This is a user-visible local state regression, not a remote authorization issue, and the current tests only prove `setUnBlur` flips a row, not that ingestion preserves it.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
- secondl1ght <85003930+secondl1ght@users.noreply.github.com> (2026-01-13)
