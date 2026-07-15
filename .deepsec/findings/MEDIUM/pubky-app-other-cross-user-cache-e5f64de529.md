# [MEDIUM] Bookmark cache is not owner-scoped

**File:** [`src/core/models/bookmark/bookmark.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/models/bookmark/bookmark.ts#L23-L56) (lines 23, 25, 54, 56)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `other-cross-user-cache`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

BookmarkModel treats the table as 'for current user', but records contain only post id and created_at. findAll and findAllSorted return the entire bookmarks table without filtering by owner. Normal isolation relies entirely on external clearDatabase calls during auth transitions; if cleanup is missed, fails, or stale async stream work writes after cleanup, the next account reads prior-user bookmarks as its own local state.

## Recommendation

Add owner Pubky to the bookmark schema and use an owner-scoped key/query for every read/write/delete, or partition Dexie storage per user. Migrate or clear old unscoped rows and keep auth cleanup only as defense in depth.

## Revalidation

**Verdict:** true-positive

The bookmark schema contains only `id` and `created_at`, and the Dexie schema is `&id, created_at`; there is no owner Pubky column or composite owner key. `BookmarkModel.findAll()` and `findAllSorted()` both read `this.table.toArray()` and return or sort every row in the table. The controller/application/service stack uses those reads for current-user bookmark state, followed collections, discover filtering, and `useBookmark` existence checks, but no layer adds an owner filter. Normal isolation depends on `clearDatabase()` during auth transitions, which is cleanup rather than a data invariant. The stale stream-poll path can write viewer-derived `post.bookmark` rows after cleanup, and any missed/failed cleanup would have the same result. In a shared browser, user A's bookmark rows can therefore be present when user B's UI calls `BookmarkController.getAll()` or `exists(postId)`, causing B to see A's saved posts or followed collections as local state. Because the rows do not record their owner, the app has no way to reject or distinguish stale rows once they are present.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
