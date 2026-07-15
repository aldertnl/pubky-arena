# [MEDIUM] Public support submissions can drive privileged Chatwoot API calls without local abuse controls

**File:** [`src/core/services/chatwoot/chatwoot.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/services/chatwoot/chatwoot.ts#L92-L174) (lines 92, 125, 165, 174)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `rate-limit-bypass`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

ChatwootService performs privileged contact search/create and conversation creation using the server-side SUPPORT_API_ACCESS_TOKEN. The traced callers are the public POST routes for feedback, reports, and copyright submissions; validation constrains shape/length but I found no local rate limiter, CAPTCHA, or bot-abuse gate before these service methods are reached. An unauthenticated attacker can repeatedly send valid payloads and force the server to create/search contacts and create support conversations through the privileged Chatwoot token. This is not a missing-auth finding because the routes are intentionally public; it is an abuse-control gap on a server-side integration.

## Recommendation

Add per-IP and/or per-identity rate limiting at the API route/controller boundary, and consider CAPTCHA or other bot friction for unauthenticated submissions. Keep Chatwoot token use server-side.

## Revalidation

**Verdict:** true-positive

The service uses server-side `SUPPORT_API_ACCESS_TOKEN` in `getBaseConfig()` and performs privileged Chatwoot contact search/create and conversation creation. The traced public routes `/api/feedback`, `/api/report`, and `/api/copyright` all parse unauthenticated JSON and delegate through controllers/applications to this service. I found validation of required fields, URL shape, issue type, and selected length-limited text fields, but no route middleware, request auth, local rate limiter, CAPTCHA/challenge, per-IP throttle, or global limiter in the inspected source. There is no project `middleware.ts`, and the support route handlers define permissive `OPTIONS` responses with `Access-Control-Allow-Origin: *`. A concrete attacker can repeatedly send valid POST bodies and force the server to issue Chatwoot search/create/contact/conversation requests with the privileged token. External platform or Chatwoot-side rate limits may exist, but there is no in-code local abuse control before the privileged integration is reached.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
