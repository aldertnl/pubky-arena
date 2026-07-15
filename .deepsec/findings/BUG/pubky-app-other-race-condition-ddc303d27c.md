# [BUG] Concurrent first prepends can drop stream items

**File:** [`src/core/models/shared/stream/stream.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/models/shared/stream/stream.ts#L237-L257) (lines 237, 239, 255, 257)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-race-condition`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

BaseStreamModel.prependItems is documented as an atomic operation, but the missing-stream path performs a separate table.get(id) and then this.upsert(id, items). If two callers prepend different items to the same stream before it exists, both can observe no existing stream and both can put a full replacement stream containing only their own item batch; the later write wins and drops the earlier items. This is not a security issue because these are local IndexedDB stream caches, but it can cause local post/user stream entries to disappear until a refetch repairs the cache.

## Recommendation

Make stream creation and merge atomic. For example, wrap the read/create/modify flow in a Dexie rw transaction, or try table.add for the missing case and on constraint failure re-read and merge via modify so concurrent creators cannot overwrite each other.

## Revalidation

**Verdict:** true-positive

BaseStreamModel.prependItems is documented as atomic, but the missing-stream branch still does a separate table.get(id) followed by this.upsert(id, items). The upsert implementation uses table.put, so it replaces the whole row rather than merging with any row that may have appeared after the get. There is no Dexie transaction inside prependItems and no table.add plus duplicate-key retry for the creation case. If two callers prepend to the same absent stream concurrently, both can observe no row and then write separate replacement rows, with the later put winning. This is reachable through callers such as LocalStreamUsersService.prependToStream, which directly delegates to UserStreamModel.prependItems; two parallel follow operations can try to create the same follower:following stream with different followees. The existing-stream path uses modify and is less problematic, but the first-create path is not atomic. This is a local cache correctness issue, not a cross-user security issue, but the reported bug is valid.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
- Kevin Karsopawiro <k.karsopawiro@gmail.com> (2025-11-06)
