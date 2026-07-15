# [BUG] Follow failures can leave local relationship state partially committed

**File:** [`src/core/services/local/follow/follow.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/services/local/follow/follow.ts#L78-L156) (lines 78, 79, 85, 149, 150, 156)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-atomicity-bug`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

LocalFollowService commits counts, connections, and relationship rows inside a Dexie transaction, but then updates user streams and invalidates timeline streams after that transaction has already committed. If updateUserStreams fails, for example from an IndexedDB write failure or transient close, the method throws and UserApplication will skip the homeserver write, while the local counts/connections/relationship tables already show the follow or unfollow as applied. That leaves the UI and local cache in a failed-but-mutated state until a later refetch repairs it.

## Recommendation

Make the local follow/unfollow mutation atomic across relationship/count/connection and stream tables, or add explicit compensation when post-transaction stream updates fail. If stream invalidation must stay outside the core transaction, do not report the whole follow operation as failed after the relationship state has already committed.

## Revalidation

**Verdict:** true-positive

LocalFollowService.create and delete wrap only UserCountsModel, UserConnectionsModel, and UserRelationshipsModel in the Dexie transaction. After that transaction commits, both methods call updateUserStreams, which updates user stream rows and invalidates post timeline streams outside the transaction. If any of those stream operations rejects, the catch block wraps the error as a database write failure and rethrows. UserApplication.commitFollow awaits LocalFollowService.create/delete before calling HomeserverService.request, so a thrown stream-update error prevents the homeserver follow/unfollow write. That leaves the relationship, connection, and count tables already mutated while the remote state was never changed. The same issue can also leave stream tables partially updated because updateUserStreams uses Promise.all over several independent operations. The useFollowUser hook will show a failure toast, but live UI backed by the local tables can still observe the committed relationship/count state. This is a real local atomicity bug rather than a security exploit.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-18)
- Taehwa Kim <hadeath03@gmail.com> (2026-02-27)
