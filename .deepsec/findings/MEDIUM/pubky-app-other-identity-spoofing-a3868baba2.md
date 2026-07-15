# [MEDIUM] Feedback submitter identity is arbitrary and unbounded

**File:** [`src/core/pipes/feedback/feedback.validators.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/pipes/feedback/feedback.validators.ts#L18-L77) (lines 18, 26, 69, 77)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `other-identity-spoofing`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The public /api/feedback route passes caller-controlled pubky and name into these validators. validatePubky only checks for a non-empty string and casts it to Pubky, while validateName only trims a non-empty value. FeedbackApplication then builds a Chatwoot email from that pubky and opens a conversation. Direct callers can spoof feedback as any Pubky identity and can send excessively long pubky/name values; only the comment has a length cap.

## Recommendation

Validate pubky with the real Pubky/PublicKey parser and enforce a conservative display-name length. If feedback is meant to represent the signed-in user, derive the Pubky server-side from an authenticated session instead of trusting the request body; also add abuse protection on the public endpoint.

## Revalidation

**Verdict:** true-positive

The current feedback route reads `pubky`, `comment`, and `name` directly from `request.json()` and passes them to `FeedbackController.submit`; it does not derive identity from a server-side session or authenticated token. `FeedbackValidators.validatePubky` only checks that the value is non-empty after trimming, then casts it to `Pubky`, and `Pubky` is only a TypeScript alias for `string` in `models.types.ts`. The SDK exposes `PublicKey.from(...)`, but this validator does not use it, so any non-empty string or any victim's valid Pubky can be used. `validateName` similarly only trims a non-empty value and has no local length cap. The application then calls `buildChatwootEmail(pubky)` and creates/finds a Chatwoot contact under `${pubky}@pubky.app`, so a direct POST can create support conversations attributed to another Pubky identity. The UI hook requires a current local user, but that is client-side only and does not protect the public API route. The comment length cap exists, but it does not mitigate the spoofed identity or unbounded submitter fields.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- Taehwa Kim <hadeath03@gmail.com> (2026-03-12)
