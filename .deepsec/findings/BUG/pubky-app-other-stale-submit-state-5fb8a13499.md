# [BUG] Article submit can lose the user's latest title or body edits

**File:** [`src/hooks/usePostInput/usePostInput.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/hooks/usePostInput/usePostInput.ts#L187-L325) (lines 187, 190, 193, 316, 324, 325)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-stale-submit-state`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

Article title and body updates are debounced by 500ms, but handleSubmit reads the React state immediately. A user who types in an article field and quickly submits can publish or save the previous state, which is especially risky for edits where old content is already present and the submit button may be enabled.

## Recommendation

Keep authoritative article title/body state synchronous. Debounce only expensive side effects, or flush/read from current refs before submit.

## Revalidation

**Verdict:** true-positive

Article title changes and article body changes are both wrapped in useDebounceCallback with a 500 ms delay. PostInput passes those handlers directly to the title Input and MarkdownEditor, and neither usePostInputAuthHandlers nor the MarkdownEditor wrapper flushes or mirrors the latest value synchronously. handleSubmit reads content and articleTitle from React state, then calls post or edit; usePost.post and usePost.edit serialize those same state values into the submitted article JSON. The submit disabled logic also uses the debounced state, which can reduce the issue for a brand-new empty article, but it does not protect edits or already-valid drafts. DialogEditPost pre-fills article title/body from the existing post, so the edit button is already enabled before the user's most recent keystroke has passed the debounce window. A concrete failure is editing an existing article, typing a new title or body text, and clicking Edit within 500 ms; the previous title/body is what reaches PostController.commitEdit. The hook tests confirm the setters are intentionally not called until timers advance, and I found no submit-time flush. This is a real data-loss bug.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-07-09)
- John R Serrano Perez <john.voiden@gmail.com> (2026-06-25)
