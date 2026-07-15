# [MEDIUM] Sentry scrubbing leaves invite/auth tokens in URLs and context fields

**File:** [`src/libs/observability/sentry.utils.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/libs/observability/sentry.utils.ts#L32-L242) (lines 32, 111, 238, 242)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `secret-in-log`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

The Sentry scrubber only removes Pubky identifiers, Pubky homeserver URLs, emails, and phone numbers from strings. It does not redact sensitive URL parameters or context keys such as inviteCode, signupToken, token, st, authorizationUrl, sessionExport, mnemonic, secretKey, password, or passphrase. This matters because invite codes are intentionally carried in URLs: src/app/invite/[inviteCode]/page.tsx redirects to /install?inviteCode=..., and Sentry transaction/request scrubbing runs over navigation/request URL strings without parsing and redacting sensitive query parameters. The same string scrubber is also used for transaction names, request data, spans, and AppError extras/contexts, so auth deeplink tokens or signup codes can be sent to Sentry when tracing/error capture is enabled. Anyone with access to the Sentry project or exported telemetry could recover unused invite/signup tokens or auth flow material.

## Recommendation

Add explicit sensitive-key and sensitive-query-parameter redaction for token-like fields. At minimum redact keys/params such as inviteCode, signupToken, token, st, authorizationUrl, sessionExport, mnemonic, secretKey, password, and passphrase, and add regression tests for /invite/<code>, /install?inviteCode=<code>, pubkyring/pubkyauth authorization URLs, breadcrumbs, extras, request URLs, transaction names, and span data.

## Revalidation

**Verdict:** true-positive

I read `sentry.utils.ts` and `sentry.constants.ts` fully; `scrubSensitiveString` only redacts Pubky identifiers/URLs, Pubky homeserver HTTP hostnames, emails, and phone numbers. Key-based redaction exists in `sanitizeForSentry`, but the configured sensitive-key set does not include `inviteCode`, `signupToken`, `token`, `st`, `authorizationUrl`, `sessionExport`, `mnemonic`, `secretKey`, `password`, or `passphrase`. Transaction and span scrubbing deliberately uses a string-only walker, so it does not parse URLs or redact sensitive query parameter names. `getSentryInitBase` wires these hooks into `beforeSend`, `beforeSendTransaction`, and `beforeSendSpan`; `sendDefaultPii: false` and replay input masking do not remove token values embedded in request or transaction URLs. The invite route redirects `/invite/<code>` to `/onboarding/install?inviteCode=<code>`, and the install template reads and verifies that query value, so the URL itself carries a usable signup token. The auth URL flow also creates signup deeplinks with `st=<inviteCode>`, and an error path stores raw `authorizationUrl` in AppError context. A Sentry project viewer could therefore recover invite or auth-flow material from navigation/request/span data or app-owned context fields.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-05-22)
