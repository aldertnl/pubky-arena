# [MEDIUM] Public copyright endpoint can be abused to spam Chatwoot

**File:** [`src/app/api/copyright/route.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/app/api/copyright/route.ts#L15-L73) (lines 15, 17, 38, 70, 73)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `rate-limit-bypass`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The POST handler is intentionally public, but it parses arbitrary JSON with request.json() and delegates directly to CopyrightController without any route-level rate limit, CAPTCHA, request-size check, or server-side field length caps. The downstream validators only require non-empty strings and basic format checks, then CopyrightApplication serializes the full form and ChatwootService uses the server-side api_access_token to search/create contacts and create conversations. The OPTIONS handler also allows any Origin to preflight JSON POSTs. An unauthenticated attacker can automate many unique or large submissions, filling the copyright inbox/contact list and consuming app and Chatwoot resources.

## Recommendation

Add abuse protection before calling Chatwoot: per-IP/fingerprint rate limits, CAPTCHA or equivalent challenge for anonymous submissions, strict Content-Length and per-field maximum lengths enforced server-side before/while parsing, and throttling/deduplication for repeated emails or identical submissions.

## Revalidation

**Verdict:** true-positive

The route is intentionally public and POST immediately calls request.json() before any route-level Content-Length check, body size guard, authentication, CAPTCHA, or rate limit. It then forwards the parsed fields to CopyrightController.submit. The validators require non-empty strings and basic email/phone/URL format for selected fields, but they do not impose per-field maximum lengths, deduplicate submissions, or throttle repeated emails. CopyrightApplication serializes the full validated form as JSON and calls ChatwootService.createOrFindContact followed by createConversation using server-side Chatwoot credentials. ChatwootService can create new contacts for new email addresses and creates a conversation containing the supplied content. The OPTIONS handler allows any Origin to preflight JSON POSTs, and even without browser CORS access, non-browser clients can directly automate the endpoint. I did not find a middleware.ts or shared API rate limiter that applies to this route in the current source. A concrete attack is an unauthenticated script submitting many unique or oversized-but-valid copyright requests, filling the Chatwoot inbox/contact list and consuming app and upstream resources.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-03-02)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
