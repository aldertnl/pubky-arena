# [MEDIUM] Unauthenticated report submission can create unlimited Chatwoot conversations

**File:** [`src/components/organisms/DialogReportPost/DialogReportPost.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/DialogReportPost/DialogReportPost.tsx#L24-L50) (lines 24, 50)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `expensive-api-abuse`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

DialogReportPost wires the report flow through useReportPost, which submits attacker-controlled report data to /api/report. The route parses JSON and directly delegates to ReportController.submit, which creates or finds a Chatwoot contact and creates a conversation using server-side Chatwoot credentials. Server-side validation limits shape and reason length, but there is no in-handler authentication, rate limit, captcha, replay control, or per-IP/per-pubky quota. Because the route also exposes permissive OPTIONS CORS headers, any site can drive browser-based spam against this endpoint. The endpoint is public by design, so this is not a missing-auth finding; the exploitable issue is lack of abuse protection around a server-side support-system write.

## Recommendation

Add server-side abuse controls before calling Chatwoot: per-IP and per-reporter rate limiting, a captcha/turnstile challenge for anonymous submissions, request body size limits, and monitoring/quotas for repeated reports. Do not rely on the UI auth gate or CDN-only rules as the sole protection.

## Revalidation

**Verdict:** true-positive

The dialog uses `useReportPost()`, and that hook does require `currentUserPubky` and `userDetails.name` before the UI submits, but this is only a client-side gate. The actual `/api/report` route parses `request.json()` and directly calls `ReportController.submit({ pubky, postUrl, issueType, reason, name })` without restoring a session, checking cookies, validating that the claimed `pubky` is the current user, or applying rate limits or bot checks. The server validators require a syntactically valid URL, one of the fixed issue types, a non-empty pubky/name, and cap `reason` at 1000 characters, so there is some shape validation. Those validators do not authenticate the reporter or impose per-IP/per-pubky quotas, and `validatePubky()` does not even verify that the pubky string has a Pubky identifier format. After validation, `ReportApplication.submit()` builds a Chatwoot email from the supplied pubky and calls `ChatwootService.createOrFindContact()` and `ChatwootService.createConversation()`. The route's `OPTIONS` handler allows `POST` with `Content-Type` from any origin, making browser-driven spam possible even though reading the response is unnecessary for the side effect. A concrete attacker can repeatedly POST valid JSON with arbitrary reporter values, a valid issue type, a valid post URL, and a short reason to create Chatwoot conversations using the app's server-side Chatwoot credentials. The issue is therefore real as an abuse-control gap on an intentionally public support endpoint, not as a simple missing-auth bug in the UI.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
