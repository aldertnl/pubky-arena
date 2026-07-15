# [MEDIUM] Public report endpoint can be used to spam Chatwoot

**File:** [`src/app/api/report/route.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/app/api/report/route.ts#L15-L21) (lines 15, 17, 21)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `rate-limit-bypass`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The unauthenticated POST handler parses arbitrary JSON and forwards it to ReportController.submit. The controller validates field shape, then the application creates or finds a Chatwoot contact and opens a report conversation with server-side Chatwoot credentials. This route is intentionally public, so missing auth alone is not the issue, and the wildcard CORS response has no credentials. The exploitable gap is the lack of server-side rate limiting around a support/moderation side effect, allowing an attacker to flood the reports inbox with automated submissions.

## Recommendation

Add server-side rate limiting before the Chatwoot call, keyed by IP and by stable report attributes such as pubky and postUrl. Consider an anonymous abuse challenge and tighter body-size limits for this public endpoint.

## Revalidation

**Verdict:** true-positive

The report route is also a public POST handler that parses arbitrary JSON and passes pubky, postUrl, issueType, reason, and name directly to ReportController.submit. No repository middleware or Next.js route configuration adds authentication, CSRF protection, rate limiting, or request throttling around this API route. The normal useReportPost hook requires currentUserPubky and userDetails.name before submitting, but a direct caller can bypass that UI guard completely. ReportValidators check that fields are present, issueType is one of the configured enum values, postUrl parses as a URL, and reason is at most 1000 characters, but they do not prove the reporter identity or limit submission frequency. ReportApplication formats the report and calls ChatwootService.createOrFindContact followed by ChatwootService.createConversation using server-only Chatwoot credentials. Reusing the same pubky may reuse the contact, but the code still creates a new conversation for every accepted submission. A concrete attack is to POST repeated bodies with a valid issueType such as hate-speech, any syntactically valid postUrl, and arbitrary reason/name values to flood the moderation inbox. The wildcard OPTIONS response makes browser preflight possible, and server-to-server requests are not constrained by CORS anyway.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-03-02)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
