# [MEDIUM] Public copyright form can drive unthrottled Chatwoot submissions

**File:** [`src/components/organisms/CopyrightForm/CopyrightForm.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/CopyrightForm/CopyrightForm.tsx#L20-L147) (lines 20, 26, 113, 123, 147)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `expensive-api-abuse`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

CopyrightForm wires submission through useCopyrightForm and its public /api/copyright workflow. The downstream route parses arbitrary JSON, validates fields, then calls Chatwoot to create/find a contact and create a conversation, but the reviewed code has no app-level rate limit, CAPTCHA, bot check, or server-side field/body length caps before those third-party API calls. The three textarea fields also have no client maxLength, though client limits would be bypassable. Because the endpoint is intentionally unauthenticated, an attacker can submit high volumes of valid requests to spam support queues and consume Chatwoot/API resources.

## Recommendation

Add server-side rate limiting and bot protection before /api/copyright reaches Chatwoot, enforce body and per-field length limits in the server validators, and return 429/400 before external API calls.

## Revalidation

**Verdict:** true-positive

The component submits through `useCopyrightForm()` to `/api/copyright`, but the server route is the relevant boundary because the client form can be bypassed. `src/app/api/copyright/route.ts` parses `request.json()` and delegates directly to `CopyrightController.submit()` without checking authentication, IP quotas, CAPTCHA, bot tokens, CSRF, replay state, request body size, or rate limits. The copyright validators require non-empty fields and validate email, phone, and the infringing URL format, but they do not impose server-side maximum lengths on the free-text fields or most string fields. After validation, `CopyrightApplication.submit()` formats the entire form as JSON and calls `ChatwootService.createOrFindContact()` followed by `ChatwootService.createConversation()`. The route also exposes permissive `OPTIONS` CORS headers, and even if a browser cannot read the final POST response, the server-side Chatwoot side effect still occurs after a successful preflight. I found no app-level middleware or rate-limit implementation in the repo that would stop repeated direct requests before these external API calls. A concrete attacker can send many valid JSON bodies with syntactically valid email, phone, URL, and role flags to create or reuse Chatwoot contacts and create conversations at support-system cost. This is not a missing-auth issue for an intentionally public endpoint; it is an abuse-control gap around a public endpoint that writes to a third-party support system.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
