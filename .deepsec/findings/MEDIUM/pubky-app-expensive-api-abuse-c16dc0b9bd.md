# [MEDIUM] Public feedback submission can be abused to spam Chatwoot

**File:** [`src/core/application/feedback/feedback.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/application/feedback/feedback.ts#L50-L68) (lines 50, 62, 68)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `expensive-api-abuse`

## Owners

**Suggested assignee:** `john.voiden@gmail.com` _(via last-committer)_

## Finding

The public `/api/feedback` route delegates unauthenticated requests into `FeedbackApplication.submit`, and this method creates or finds a Chatwoot contact and then creates a Chatwoot conversation for every accepted submission. The controller validates presence and caps only the comment length, but there is no route-local rate limit, CAPTCHA, per-Pubky throttling, or abuse token before the external Chatwoot side effects. An attacker can send repeated POSTs to the public endpoint and generate support conversations/contact lookups using the server-side Chatwoot API token.

## Recommendation

Add server-side abuse protection before calling Chatwoot, such as IP/user/Pubky rate limiting with 429 responses, plus stricter Pubky format/length validation. Keep the limiter in the route or a handler wrapper that directly protects the endpoint.

## Revalidation

**Verdict:** true-positive

The `/api/feedback` route accepts unauthenticated POST JSON, parses `pubky`, `comment`, and `name`, and delegates directly to FeedbackController. FeedbackValidators only require non-empty pubky/name and cap `comment` at `FEEDBACK_MAX_CHARACTER_LENGTH` of 1000; they do not validate pubky format, enforce auth, or throttle callers. FeedbackApplication.submit then builds `pubky@pubky.app`, calls ChatwootService.createOrFindContact, and always calls ChatwootService.createConversation for each accepted request. ChatwootService uses server-side Chatwoot credentials from Env and performs real contact search/create and conversation POSTs. The route also exposes an OPTIONS handler with `Access-Control-Allow-Origin: *`, so cross-origin browser requests can cause the side effect even if the response is not readable. I found no middleware, route wrapper, rate limiter, CAPTCHA, idempotency key, or per-Pubky/IP quota in the code path. A concrete attacker can repeatedly POST syntactically valid bodies with arbitrary pubky/name/comment values and create support conversations or contact lookups using the server's Chatwoot token.

## Recent committers (`git log`)

- John R Serrano Perez <john.voiden@gmail.com> (2026-06-15)
- V <jovanovicv90@gmail.com> (2026-05-05)
