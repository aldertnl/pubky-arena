# [BUG] Parent lookup queries children instead of the supplied post

**File:** [`src/core/models/post/relationships/postRelationships.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/models/post/relationships/postRelationships.ts#L53-L55) (lines 53, 55)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-logic-bug`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

`getParentPostId(postId)` is documented to return the parent for the given post, but it queries the `replied` index for rows whose parent equals `postId` and then returns that same `replied` value. For a reply row, the relationship is keyed by the reply's own `id`, so this method should read the row by primary key and return its `replied` field. As written, it returns `undefined` for a normal reply unless that reply also has children, and returns the input parent ID for posts that have replies. I found no current production caller, so this is a latent model bug rather than an exploitable security issue.

## Recommendation

Change the implementation to fetch the relationship row for `postId` by primary key, e.g. `const rel = await this.findById(postId); return rel?.replied;`, and add tests for a reply, a root post, and a post that has child replies.

## Revalidation

**Verdict:** true-positive

The target file still implements getParentPostId by querying the replied index for rows whose parent equals the supplied postId and then returning that same replied value. The schema confirms id is the primary key for a post relationship row, while replied is an index used for child-reply lookups. LocalPostService.readRelationships and other existing relationship reads use findById when they need the row for a specific post, which is the correct access pattern for a parent lookup. With a normal reply row where id is the reply composite ID and replied is the parent URI, passing the reply ID to getParentPostId returns undefined unless another row happens to have replied equal to that reply ID. Passing a parent URI or ID that has children returns the input parent value, not a parent of the supplied post. A static search found no production caller of getParentPostId, so this is not currently a security-exploitable path. It is still a real latent model bug exactly as described.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
- Miguel Medeiros <miguel@miguelmedeiros.com.br> (2025-11-27)
