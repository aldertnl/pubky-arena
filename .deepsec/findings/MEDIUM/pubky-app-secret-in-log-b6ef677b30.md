# [MEDIUM] Unsanitized AppError context is logged before redaction

**File:** [`src/libs/error/error.factories.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/libs/error/error.factories.ts#L57) (lines 57)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `secret-in-log`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

createAppError logs params.context directly with Logger.error before the Sentry scrubber is applied. Traced callers pass user-controlled PII into AppError context, including raw endpoint URLs from httpResponseToError/safeFetch and explicit email/phone values from public form validation paths. In non-test server runtimes Logger.error always writes to console/stdout, so failed public requests can persist PII, Pubky identifiers, and any future token-bearing URL/context in logs while bypassing the existing Sentry redaction layer.

## Recommendation

Redact or whitelist AppError context before Logger.error, preferably by reusing the same keyed/string scrubber used for Sentry. At minimum strip URL query strings/fragments and sensitive context keys before logging.

## Revalidation

**Verdict:** true-positive

`createAppError` constructs the `AppError` and immediately calls `Logger.error(..., params.context)` before calling `captureAppError(error)`. The `Logger` implementation has no redaction layer; in non-test runtimes it always logs `error` level messages, and on the server path it forwards the raw arguments to `console.error`. The Sentry path does scrub via `sanitizeForSentry` and `scrubSensitiveData`, but that happens after the console/stdout log and only affects Sentry event payloads. Current callers pass sensitive or user-controlled values in context, including copyright validator contexts such as `{ field: 'email', value: email }` and `{ field: 'phoneNumber', value: phoneNumber }`, Chatwoot utility contexts containing `email`, and HTTP error contexts containing raw `endpoint` or `url` values. A concrete attacker can submit an invalid public copyright form email or phone and cause the raw value to be printed to server logs through the validation factory path. `handleApiError` only returns the message to the client, so the leak is specifically to logs rather than the HTTP response. No current code sanitizes or whitelists `params.context` before the `Logger.error` call.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-05-07)
- V <jovanovicv90@gmail.com> (2026-05-05)
- SHAcollision <127778313+SHAcollision@users.noreply.github.com> (2026-01-27)
