# [MEDIUM] Public report submission can spam Chatwoot through server credentials

**File:** [`src/core/application/report/report.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/application/report/report.ts#L82-L102) (lines 82, 96, 102)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `expensive-api-abuse`

## Owners

**Suggested assignee:** `john.voiden@gmail.com` _(via last-committer)_

## Finding

ReportApplication.submit creates or finds a Chatwoot contact and then creates a conversation using server-side Chatwoot credentials for every valid report payload. The public /api/report route and controller path validate field shape, but there is no in-repo rate limit, CAPTCHA, deduplication, or abuse control before these external API calls. An unauthenticated attacker can automate requests with arbitrary pubky/name/reason values to create contacts and conversations, consuming support capacity and Chatwoot/API quota.

## Recommendation

Add server-side abuse protection before calling Chatwoot, such as IP and pubky-based rate limits, CAPTCHA/Turnstile for anonymous submissions, deduplication, and/or a queued moderation workflow. Keep the checks in the route/controller path so direct API callers cannot bypass them.

## Revalidation

**Verdict:** true-positive

The `/api/report` route is public, accepts POST JSON, and delegates directly to ReportController without session checks. ReportValidators require non-empty fields, validate `postUrl` only as a URL, restrict `issueType` to an enum, and cap `reason` at 1000 characters, but they do not rate limit, authenticate, deduplicate, or validate a real Pubky identity. ReportApplication.submit then formats the report and calls ChatwootService.createOrFindContact followed by ChatwootService.createConversation using server-side Chatwoot credentials. The route has a permissive OPTIONS handler for JSON POST preflights, and no source file or middleware in the app adds a limiter, CAPTCHA, or abuse token before the Chatwoot calls. A concrete attacker can automate POSTs with arbitrary pubky/name/postUrl/reason values and generate repeated contact searches and conversations. Existing validation reduces malformed payloads but does not mitigate resource or support-inbox abuse.

## Recent committers (`git log`)

- John R Serrano Perez <john.voiden@gmail.com> (2026-06-15)
- V <jovanovicv90@gmail.com> (2026-05-05)
