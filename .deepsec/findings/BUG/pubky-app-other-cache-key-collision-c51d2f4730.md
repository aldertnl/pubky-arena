# [BUG] Hot tag cache key omits response-shaping parameters

**File:** [`src/core/application/hot/hot.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/application/hot/hot.ts#L34-L107) (lines 34, 48, 69, 70, 76, 104, 107)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-cache-key-collision`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

HotApplication builds the local cache key only from timeframe and reach, then reuses that cached row for later calls. The Nexus request can also include user_id and taggers_limit, both of which are serialized into the upstream query string and can change the returned hot tags or taggers_id arrays. A response fetched for one user_id or taggers_limit can therefore be stored under the same timeframe:reach key and returned to a later caller with different parameters, producing stale or incorrect personalized hot tag data.

## Recommendation

Build the cache key from every parameter that can affect the Nexus response, especially user_id and taggers_limit, or bypass/use a separate cache for personalized/tagger-limited requests. Keep the cache key normalization and fetch parameter normalization in one helper so they cannot drift.

## Revalidation

**Verdict:** true-positive

I read `hot.ts` fully and `HotApplication.getOrFetch` builds the local cache id only from `timeframe` and `reach` via `buildHotTagsId`. The Nexus request type `TTagHotParams` also includes `user_id` and `taggers_limit`, and `tagApi.hot` serializes all supplied parameters into the upstream query string except path-only tag params. `taggers_limit` can change the returned `taggers_id` arrays, and the controller documents and forwards it as a supported parameter. `HotController` also injects the current user id when a reached hot-tag view lacks `user_id`, so personalized/reached requests are part of the intended API shape. Pagination with `skip > 0` bypasses cache and `limit` is intentionally stripped so the full set can be cached, but there is no equivalent normalization or bypass for `user_id` or `taggers_limit`. A cached row fetched for one `taggers_limit` or user-shaped query can therefore be returned for a later call with a different shaping parameter under the same `timeframe:reach` id. Logout clears IndexedDB, so cross-account persistence is somewhat mitigated, but the cache-key collision remains real within the application API.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- James <74595920+catch-21@users.noreply.github.com> (2026-02-03)
