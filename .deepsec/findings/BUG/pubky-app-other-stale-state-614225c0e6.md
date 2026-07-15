# [BUG] Article cover image can remain stale after attachments change

**File:** [`src/hooks/usePostArticle/usePostArticle.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/hooks/usePostArticle/usePostArticle.ts#L78-L88) (lines 78, 85, 88)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** medium • **Slug:** `other-stale-state`

## Owners

**Suggested assignee:** `john.voiden@gmail.com` _(via last-committer)_

## Finding

The cover-image effect returns immediately when there are no attachments and only updates state when the first resolved attachment is an image. It never clears an existing cover image when attachments become empty, resolve to no metadata, resolve to a non-image, or fail to load. If the same hook instance is reused for a different article or updated post data, PostArticle/PostArticleDetail can render the previous article's cover image.

## Recommendation

Clear coverImage at the start of the attachments effect, and also explicitly clear it in the empty-metadata, non-image, and catch branches while preserving the cancellation guard.

## Revalidation

**Verdict:** true-positive

The current attachment effect only calls setCoverImage on the successful image path. It returns immediately when attachments is null or empty, does nothing when FileController.getMetadata returns an empty array, does nothing when the first metadata item is non-image, and only shows a toast in the catch branch. FileController.getMetadata itself just reads local file metadata by attachment URI and does not clear caller state. Both PostArticle and PostArticleDetail render finalCoverImage from localCoverImage || coverImage, so a stale hook coverImage is directly visible when there is no local image overriding it. React preserves hook state when the same component instance receives new props, and the single-post article path has no key that would force PostArticleDetail to remount on prop changes. A concrete scenario is an article detail or live post content instance that first resolves an image attachment, then receives updated article data with no attachment, no metadata, a non-image first attachment, or a metadata error; the old cover remains rendered. I found no current patch at commit 1b29a961 that clears coverImage in those branches. This is not an authorization issue, but it is a real visible stale-state bug.

## Recent committers (`git log`)

- John R Serrano Perez <john.voiden@gmail.com> (2026-07-07)
- V <jovanovicv90@gmail.com> (2026-05-05)
