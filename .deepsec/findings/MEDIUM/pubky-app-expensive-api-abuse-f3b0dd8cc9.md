# [MEDIUM] Public copyright submissions can be spammed into Chatwoot

**File:** [`src/core/controllers/copyright/copyright.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/controllers/copyright/copyright.ts#L20-L41) (lines 20, 41)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `expensive-api-abuse`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The public /api/copyright route delegates directly to CopyrightController.submit, and this controller only validates required fields before calling CopyrightApplication.submit, which creates/finds a Chatwoot contact and creates a conversation using server-side Chatwoot credentials. I found no route-local rate limiting, CAPTCHA, idempotency, or server-side maximum lengths for most fields; the validators mostly trim and require values. An unauthenticated attacker can repeatedly send valid POST bodies, or very large field values within platform limits, to flood the support inbox and consume Chatwoot/application resources. The public OPTIONS handler also allows cross-origin JSON POST preflights, so a malicious site can cause browsers to send the side-effecting requests even if it cannot read the response.

## Recommendation

Add code-level abuse controls on the API route before invoking the controller: per-IP and per-email rate limits, request body size limits, per-field maximum lengths, and ideally CAPTCHA or another bot-control mechanism for unauthenticated public submissions. Consider queuing or deduplicating submissions before creating Chatwoot conversations.

## Revalidation

**Verdict:** true-positive

The `/api/copyright` route is public, parses JSON, and delegates to CopyrightController.submit without authentication or abuse checks. CopyrightController validates required fields, email format, phone format, one infringing URL format, and role selection, but most string fields have no server-side maximum length and there is no request-level quota or idempotency check. CopyrightApplication serializes the validated form data into a JSON message, calls ChatwootService.createOrFindContact with the submitted email, then calls ChatwootService.createConversation in the copyright inbox using server-side credentials. The route's OPTIONS handler allows cross-origin JSON POST preflights with `Access-Control-Allow-Origin: *`; even if a browser cannot read the POST response, it can still send the side-effecting request. I found no middleware, CAPTCHA, Turnstile, IP/email limiter, body-size guard in this route, or deduplication layer before Chatwoot. A concrete attacker can repeatedly POST valid-looking copyright forms, or oversized-but-parseable field values within deployment limits, to create contact lookups and support conversations. The validation present is form-shape validation, not abuse protection.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
