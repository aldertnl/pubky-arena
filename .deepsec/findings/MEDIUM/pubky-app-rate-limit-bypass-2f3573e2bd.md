# [MEDIUM] Public feedback endpoint can be used to spam Chatwoot

**File:** [`src/app/api/feedback/route.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/app/api/feedback/route.ts#L15-L21) (lines 15, 17, 21)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `rate-limit-bypass`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The unauthenticated POST handler accepts arbitrary JSON and forwards validated fields to FeedbackController.submit. Tracing the controller/application path shows this creates or finds a Chatwoot contact and creates a Chatwoot conversation using server-side Chatwoot credentials. The route is intentionally public, and the wildcard CORS response does not include credentials, but there is no server-side rate limiting or abuse gate around a paid/support-system side effect. A remote attacker can repeatedly submit feedback to create support conversations and flood staff queues.

## Recommendation

Add server-side rate limiting before the Chatwoot call, keyed by IP and preferably also by pubky/email-like identity. Consider a CAPTCHA/proof-of-work or similar abuse control for anonymous public submissions, and enforce request body size limits.

## Revalidation

**Verdict:** true-positive

The route is a public POST handler that parses request.json(), extracts pubky, comment, and name, and delegates directly to FeedbackController.submit without any server-side authentication or rate check. There is no middleware.ts/proxy.ts in the repo, and next.config.ts does not add route-level abuse controls for this endpoint. The normal client hook only submits when a current user/profile is loaded, but that is purely client-side and the API route trusts the JSON body. FeedbackValidators only require non-empty pubky/name/comment and cap comment length at 1000 characters; they do not bind pubky to a session or throttle repeated submissions. FeedbackApplication builds a Chatwoot email from the supplied pubky, then ChatwootService uses server-side Chatwoot credentials to search/create a contact and create a conversation. The Chatwoot adapter validates environment variables and HTTP responses, but has no limiter, CAPTCHA, nonce, or idempotency check. A remote attacker can repeatedly send valid JSON bodies, including via curl or a cross-origin request after the permissive OPTIONS preflight, and each accepted request can create another support conversation. The missing Access-Control-Allow-Origin on the POST response would only prevent browser JavaScript from reading the response; it does not prevent the side effect.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-03-02)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
