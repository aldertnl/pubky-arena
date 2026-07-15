# [BUG] Viewer-specific tag relationship state is reused after viewer changes

**File:** [`src/hooks/useTagged/useTagged.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/hooks/useTagged/useTagged.tsx#L83-L300) (lines 83, 91, 105, 113, 202, 203, 300)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-stale-viewer-relationship`

## Owners

**Suggested assignee:** `john.voiden@gmail.com` _(via last-committer)_

## Finding

The hook fetches tags with a viewer-specific `viewer_id`, but `hasFetched` is reset only when `userId` changes. If the viewer changes independently, such as an anonymous profile view becoming an authenticated view or a caller changing `options.viewerId`, the effect still returns early because `hasFetched` remains true. The cached `NexusTag.relationship` boolean is then reused by `transformTagsForViewer` and by `handleTagToggle`, even though that relationship belongs to the previous viewer and tagger arrays may be truncated. Homeserver ownership checks prevent this from becoming a cross-user write vulnerability, but the UI can show the wrong selected state and choose the wrong add/delete operation, with possible local cache/count corruption until a refetch.

## Recommendation

Reset/refetch when `viewerId` changes, or avoid persisting viewer-specific `relationship` as entity tag state. Derive relationship only from data fetched for the current viewer before allowing `handleTagToggle` to decide between create and delete.

## Revalidation

**Verdict:** true-positive

useTagged computes viewerId from options.viewerId or currentUserPubky and sends it to UserController.fetchTags, so the fetched NexusTag.relationship is viewer-specific. The hasFetched flag is reset only when userId changes; when viewerId changes while userId is the same, the fetch effect re-runs but immediately returns because hasFetched is still true. UserController.upsertTags stores the NexusTag array under UserTagsModel by tagged user id only, with no viewer dimension, so the relationship value from the previous viewer remains in localTags. transformTagsForViewer prioritizes tag.relationship over checking the current viewerId in taggers, and handleTagToggle also prioritizes the passed relationship/currentTag.relationship before the taggers fallback. TaggedItem uses that relationship for the selected visual state and passes it into the toggle path. A concrete scenario is loading a public profile while anonymous, caching relationship false, then signing in as a user who already tagged that profile but is absent from the truncated taggers array; the UI still shows unselected and chooses commitCreate instead of delete. The reverse stale-true case can choose commitDelete for the wrong viewer and locally decrement counts or remove a tag until a refetch. HomeserverService still enforces owned session paths for writes, so this does not become a cross-user homeserver write vulnerability, but the stale viewer relationship and local/cache corruption are real.

## Recent committers (`git log`)

- John R Serrano Perez <john.voiden@gmail.com> (2026-06-15)
- Taehwa Kim <hadeath03@gmail.com> (2026-05-28)
- V <jovanovicv90@gmail.com> (2026-05-05)
