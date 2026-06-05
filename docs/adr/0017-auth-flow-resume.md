# ADR 0017: Auth Flow Resume via Persisted Authorization URL

## Status

Proposed — 2026-06-05

## Context

Pubky Ring sign-in uses the HTTP relay **inbox** model: when the user approves in Ring, an encrypted session token is posted to a relay channel where it persists for approximately five minutes. Franky polls that channel via the Pubky SDK until the token arrives.

Starting a flow is local-only (`startAuthFlow`): the SDK generates a `client_secret` and an `authorizationUrl` (QR/deeplink). Polling (`tryPollOnce`) is the only network step until approval.

The secret lives in WASM memory. A full page refresh, tab discard, or process reset wipes it. The user may have already approved in Ring and the token may still be waiting in the inbox, but Franky cannot decrypt it without the secret. The user is forced to scan a new QR code and Ring's approval to the old channel is lost.

The Pubky SDK now exposes `resumeAuthFlow(authorizationUrl)`, which parses the secret and relay from a previously saved URL and reconnects to the same inbox channel. The Rust-side mechanism was always available; the JS binding was added to close [pubky-core#353](https://github.com/pubky/pubky-core/issues/353).

The `authorizationUrl` already embeds every value needed to resume (capabilities, relay base URL, secret). Persisting that URL is sufficient. The same URL can be shown again so the user does not need a new scan.

## Decision

Franky will **persist the pending authorization URL in browser storage** when an auth flow starts and **resume via `resumeAuthFlow`** when the sign-in UI loads and a valid pending flow exists, instead of always calling `startAuthFlow`.

### Rules

- **Store** the display URL (sign-in deeplink or signup deeplink after Franky's URL rewrite) together with a timestamp and flow type (`signin` / `signup`) when a new flow is created.
- **On sign-in UI load**, if a pending entry exists and is within the relay inbox TTL (~5 minutes), call `resumeAuthFlow` with the saved URL. Otherwise discard the entry and start a fresh flow.
- **Clear** the stored entry on successful session initialization, explicit user refresh of the QR, flow expiry, sign-out, and any terminal auth failure.
- **Prefer `sessionStorage`** over `localStorage`. The SDK documents that the URL contains the `client_secret` in plaintext; tab-scoped storage limits exposure and aligns with the short inbox TTL. Do not log or report the URL to observability tools.
- **Resume must not wipe local app state** the way a fresh sign-in attempt does (e.g. IndexedDB clear on new flow). Only genuinely new flows reset pre-auth local state.
- **Signup flows** persist the signup deeplink URL; the SDK parses homeserver and invite parameters from it on resume.

Resumed flows use the same polling and approval path as freshly started flows. The user sees the same QR code. If Ring already posted the token, the first poll after resume should resolve immediately.

## Consequences

### Positive ✅

- Approvals survive page refresh and tab reload within the inbox TTL; users are not asked to scan again unnecessarily.
- Aligns Franky with the inbox store-and-forward model instead of treating WASM lifetime as the session boundary.
- Reuses an SDK-supported API rather than reimplementing secret parsing or channel derivation in the app.

### Negative ❌

- Persisting the authorization URL stores a sensitive secret in browser storage; mitigated by `sessionStorage`, short TTL, and aggressive cleanup.
- Two tabs on the sign-in page can race on the same stored entry; flow cancellation and controller-level guards must prevent duplicate active flows.
- Adds a dependency on a newer Pubky SDK version before this can ship.

### Neutral ⚠️

- Resume and poll retry resilience are complementary: retry handles live flows; resume handles dead handles. Both may be needed for robust mobile auth.
- Storage read/write logic adds lifecycle hooks across controller and sign-in UI, but stays localized to the auth onboarding path.

## Acceptance Criteria

- User starts Ring sign-in, refreshes the page within five minutes: same QR URL is shown and polling resumes without a new scan.
- User refreshes after inbox TTL: stored entry is discarded and a new flow is offered.
- Ring approval completes after refresh: user reaches authenticated state normally.
- Successful login, sign-out, or explicit QR refresh removes the stored entry.
- Signup deeplink flows resume with the same URL including invite and homeserver parameters.
- Resume path does not clear IndexedDB or other pre-auth local state that a fresh flow reset would.

## Implementation Notes

- Touch points: homeserver auth URL generation, auth controller flow lifecycle, sign-in hook mount path, pending-flow storage helper.
- Bump `@synonymdev/pubky` to a release that exports `resumeAuthFlow`.
- Unit tests: resume on valid pending entry, TTL expiry, cleanup on success and sign-out, signup URL round-trip.

## Related Decisions

- Depends on: relay inbox transport (Pubky SDK 0.7+ `/inbox` endpoint)
- Related: poll retry resilience for transient relay errors during an active flow (separate decision; not yet recorded as ADR)
- Related: [pubky-core#353 — AuthFlow cannot be resumed after a page refresh](https://github.com/pubky/pubky-core/issues/353)

## References

- [Pubky SDK `resumeAuthFlow` binding](https://github.com/pubky/pubky-core/blob/main/pubky-sdk/bindings/js/src/pubky.rs#L141-L158)
- [pubky-core#353](https://github.com/pubky/pubky-core/issues/353)

---

See [ADR Guidelines](../adr-guidelines.md) for when and how to write ADRs.
