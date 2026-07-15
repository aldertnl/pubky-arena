# [CRITICAL] OG metadata preview can SSRF loopback services

**File:** [`src/hooks/useOgMetadata/useOgMetadata.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/hooks/useOgMetadata/useOgMetadata.ts#L50-L64) (lines 50, 64)
**Project:** pubky-app
**Severity:** CRITICAL • **Confidence:** high • **Slug:** `ssrf`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The hook forwards a user-controlled URL to the public `/api/og-metadata` endpoint. Downstream, the OG metadata service permits IP literals and calls `checkDnsSafety`; that helper passes IP hostnames directly to `isIpSafe`, whose localhost block only rejects exact `127.0.0.1`, `::1`, and `0.0.0.0`. Other loopback addresses such as `127.0.0.2` pass and are fetched server-side. The same path also validates only the first resolved A record before a separate `fetch()` resolves the hostname again, leaving DNS round-robin/rebinding bypass room. An attacker can therefore make the server issue GET requests to localhost/internal services via URL previews.

## Recommendation

Fix this on the server-side OG metadata path: block the full loopback/reserved ranges (`127.0.0.0/8`, `0.0.0.0/8`, IPv6 loopback/ULA/link-local, broadcast/reserved ranges), validate all A/AAAA answers, and bind the outbound request to a validated address or use a fetch/agent lookup that enforces the same validation at connection time.

## Revalidation

**Verdict:** true-positive

The hook fully trusts its url argument and forwards it to /api/og-metadata as an encoded query parameter. That client-side behavior is not the root SSRF guard, but it is a reachable UI entry point into the vulnerable server-side OG fetch path. PostLinkEmbeds uses LinkifyIt, ignores only ftp: and mailto:, and sends ordinary http:// or https:// links for unknown hosts to the Generic provider, which renders GenericPreview and calls this hook. A user-controlled post or composer input containing an HTTP loopback URL can therefore flow through this hook to the public API endpoint. The downstream route validates only HTTP(S) and hostname shape before the service calls checkDnsSafety and then fetches server-side. As confirmed in nextjs.utils.ts and libs/network/network.ts, loopback addresses other than exact 127.0.0.1 pass, and DNS validation is not bound to the actual fetch connection. The hook’s cache key and encodeURIComponent usage do not mitigate SSRF; they only format and cache the request. This is the same underlying server vulnerability reached through a different file, and cross-file duplicate marking is not allowed by the requested rules.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- secondl1ght <85003930+secondl1ght@users.noreply.github.com> (2025-12-11)
