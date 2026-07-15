# [BUG] Repost embed kind is passed as a cached string instead of the Pubky enum

**File:** [`src/core/pipes/post/post.normalizer.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/pipes/post/post.normalizer.ts#L77-L79) (lines 77, 79)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-logic-bug`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

When creating a post with an embed, the code reads the embedded post from Dexie and passes `embeddedPost.kind` into `new PubkyAppPostEmbed(...)` via a type cast. `PostDetailsModel.kind` is stored as strings such as `short`, `long`, or `collection`, while `PubkyAppPostEmbed` expects the numeric `PubkyAppPostKind` enum. The edit path already uses `mapKindToEnum`, but the create path does not. This can misclassify long-form or collection embeds when creating reposts/quotes, producing incorrect homeserver metadata.

## Recommendation

Replace the cast with `this.mapKindToEnum(embeddedPost.kind)` so create-time embed reconstruction matches the edit path.

## Revalidation

**Verdict:** true-positive

The create path still constructs embedObject with new PubkyAppPostEmbed(post.embed, embeddedPost.kind as unknown as PubkyAppPostKind). PostDetailsModel.kind is a string field, and local post creation lowercases the PubkyAppPost.kind string into values such as short, long, image, or collection. The pubky-app-specs type definition and generated wrapper show that PubkyAppPostEmbed expects PubkyAppPostKind, whose enum values are numeric. The TypeScript cast performs no runtime conversion, so a cached string like long or collection is passed to a numeric enum parameter. The edit path in the same file already calls mapKindToEnum(embeddedPost.kind), which confirms the intended conversion exists but is not used here. A concrete scenario is creating a quote/repost of a cached collection post: the embed kind is built from the string collection rather than PubkyAppPostKind.Collection, producing incorrect homeserver metadata. This is a real logic bug, not a security boundary violation.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-22)
