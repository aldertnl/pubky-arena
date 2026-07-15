# [BUG] Tag creation failure makes post creation report failure after the post is already committed

**File:** [`src/core/application/post/post.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/application/post/post.ts#L227-L254) (lines 227, 253, 254)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-partial-commit`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

commitCreate sends the post to the homeserver before creating tags. If TagApplication.commitCreate fails, the method rejects even though the post already exists locally and remotely. Callers can show a post creation failure and allow retry, which can create duplicate posts while the original post remains published without all requested tags.

## Recommendation

Either make tags a separate best-effort operation with a tag-specific error, or implement an explicit all-or-nothing rollback/delete of the already-created post when tag creation is required to succeed.

## Revalidation

**Verdict:** true-positive

The `commitCreate` sequence is local post create, homeserver post PUT, then optional `TagApplication.commitCreate`. If tag creation throws, `PostApplication.commitCreate` does not catch it, does not delete the already-created post, and does not convert it to a partial-success result. `TagApplication.commitCreate` can roll back its own local tag write on homeserver failure, but it only handles tag state, not the parent post. The post application tests explicitly assert that a tag creation error is propagated after the post save and homeserver PUT have already happened. The `usePost` hook catches the rejected create call and shows a generic post/reply failure toast, so the caller does not receive the created post id through the normal success path. A user retry after that failure can publish a second post while the first post remains locally and remotely committed, just missing some requested tags. That is a real partial-commit bug rather than an authorization issue.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
- Taehwa Kim <hadeath03@gmail.com> (2026-05-14)
