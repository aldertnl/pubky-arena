# [BUG] Late stream fetches can render stale posts after the active feed changes

**File:** [`src/components/organisms/Timeline/Feed/TimelineFeedContent/TimelineFeedContent.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/Timeline/Feed/TimelineFeedContent/TimelineFeedContent.tsx#L132) (lines 132)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-race-condition`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

TimelineFeedContent delegates all feed state to useStreamPagination({ streamId }) and renders the returned postIds. The imported hook clears state when streamId changes, but its async fetchStreamSlice path has no request generation, cancellation, or streamId freshness check before calling setPostIds, setLastPostId, setStreamTail, setHasMore, and setError. A slow request for the previous stream can therefore resolve after a newer stream is selected and paint old feed posts or pagination state into the current feed. This is not an attacker-exploitable security issue from the reviewed code, but it is a real UI/data consistency race.

## Recommendation

Add a request/version token or abort mechanism in useStreamPagination and ignore results unless they belong to the latest streamId/request. Also cover rapid streamId changes with a regression test where the older request resolves last.

## Revalidation

**Verdict:** true-positive

TimelineFeedContent delegates stream state to useStreamPagination({ streamId }) and renders the returned postIds. In useStreamPagination, the effect keyed on [streamId] clears state and calls fetchStreamSlice(true), but it does not return a cleanup function and does not increment any request generation token. fetchStreamSlice captures the streamId from the render that created it, awaits prepareStreamForInitialLoad, getCachedLastPostTimestamp, and getOrFetchStreamSlice, then unconditionally calls setters such as setStreamTail, setLastPostId, setHasMore, setError, and setPostIds. The lower StreamPostsController and PostStreamApplication paths also just await local/Nexus work and provide no abort signal or stale-result check back to the hook. A concrete race is selecting feed A, switching quickly to feed B, and having feed A's slower initial request resolve after feed B's request; the old result can overwrite the current hook state and paint A's posts or pagination cursor under B. The hook does clear state when streamId changes, but that only handles synchronous stale state, not late async completions. This is not an attacker-controlled security issue from the reviewed code, but it is a real UI/data consistency race.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-07-08)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-05-08)
