# [MEDIUM] Report submission reaches a public Chatwoot-backed endpoint without in-code abuse controls

**File:** [`src/hooks/useReportPost/useReportPost.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/hooks/useReportPost/useReportPost.ts#L61) (lines 61)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `expensive-api-abuse`

## Owners

**Suggested assignee:** `john.voiden@gmail.com` _(via last-committer)_

## Finding

The hook submits reports to `/api/report` with `postJson` at line 61. The client-side current-user check at lines 53-56 is not a security boundary: the Next.js API route can be called directly, parses arbitrary JSON, and delegates to `ReportController.submit`, which performs Chatwoot contact/conversation API calls using server-side credentials. I found validation for field shape and reason length, but no route-level authentication, rate limiting, CAPTCHA/challenge, per-pubky throttling, or global middleware limiter in the codebase. The route also has a wildcard OPTIONS CORS preflight, so browser-based cross-origin spam can still trigger the side-effecting POST even if the response is not readable. An attacker can abuse this to create large volumes of Chatwoot conversations and consume support/API resources.

## Recommendation

Add server-side abuse protection before `ReportController.submit`, such as IP and pubky-based rate limits, request body size limits, and a challenge for anonymous/public submissions. Do not rely on the hook's client-side authenticated-user check.

## Revalidation

**Verdict:** true-positive

The hook posts report data to `/api/report`, but its `currentUserPubky` and `userDetails?.name` checks are only client-side UI gates. The `/api/report` route itself accepts arbitrary JSON from `request.json()`, extracts `pubky`, `postUrl`, `issueType`, `reason`, and `name`, and calls `ReportController.submit` without reading server-side cookies, headers, or a session. `ReportValidators` bounds `reason` and validates URL/issue-type shape, but it only checks `pubky` and `name` for non-empty strings and does not add abuse throttling. `ReportApplication.submit` builds a Chatwoot contact email from the supplied `pubky` and calls `ChatwootService.createOrFindContact` and `createConversation` with server-side credentials. The codebase search found no route-level limiter, CAPTCHA, middleware, or global request throttle, and there is no `middleware.ts`. The route's `OPTIONS` handler allows cross-origin JSON POST preflights, and even unreadable CORS responses would not prevent the side-effecting POST from reaching the server. A direct caller can therefore bypass the hook and create large volumes of support report conversations.

## Recent committers (`git log`)

- John R Serrano Perez <john.voiden@gmail.com> (2026-06-15)
- V <jovanovicv90@gmail.com> (2026-05-05)
