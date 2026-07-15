# [BUG] Article cover image can remain stale after navigating to an article without a cover

**File:** [`src/components/organisms/PostArticleDetail/PostArticleDetail.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/PostArticleDetail/PostArticleDetail.tsx#L41-L79) (lines 41, 55, 79)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-stale-cover-image`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

PostArticleDetail renders the cover image returned by usePostArticle. The imported hook's attachment effect returns immediately when attachments is null or empty and only sets coverImage when metadata resolves to an image; it does not clear a previous coverImage for empty attachments, empty metadata, a non-image first attachment, or fetch failure. If React preserves this client component while navigating between article posts, the previous article's cover image can remain visible on the next article. This is not an exploitable security vulnerability in the reviewed path, but it can show incorrect media for a different post.

## Recommendation

Reset coverImage to null at the start of the attachment effect and before every no-cover path in usePostArticle. Consider keying the article detail subtree by postId if route transitions are expected to preserve component instances.

## Revalidation

**Verdict:** true-positive

PostArticleDetail renders finalCoverImage from localCoverImage || coverImage, where coverImage comes from usePostArticle. The imported usePostArticle hook has a cancellation flag for late metadata responses, but it does not reset coverImage at the start of its attachment effect. If attachments is null or empty, the effect returns immediately before clearing the old cover. If FileController.getMetadata returns an empty array, returns a first attachment that is not an image, or throws, the hook likewise leaves the previous coverImage state in place. The post detail component is not keyed by postId, and the direct post route intentionally preserves the page shell across post-id changes, so a preserved client subtree receiving new article props is a plausible navigation path. A concrete UI trigger is viewing an article whose first attachment resolves to an image, then navigating within the same client session to an article with no cover attachment while the same PostArticleDetail instance is reconciled with new props. In that case localCoverImage is null for the new post and the stale hook coverImage remains renderable. This is not exploitable as a security issue, but it is a real stale-media display bug.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-05-19)
