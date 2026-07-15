# [MEDIUM] Public OG metadata fetch endpoint has no abuse throttling

**File:** [`src/app/api/og-metadata/route.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/app/api/og-metadata/route.ts#L21-L32) (lines 21, 27, 32)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `rate-limit-bypass`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

The GET route accepts an arbitrary url query parameter and delegates it to OgMetadataController.fetch(), which can perform DNS resolution, up to five outbound fetch attempts with 10 second timeouts, and a streamed response read up to 5MB. The only mitigation in this file is public CDN caching for identical URLs; an attacker can vary URLs, query strings, or hostnames to bypass cache reuse and force repeated outbound work. This creates an unauthenticated resource-exhaustion and outbound-request abuse vector.

## Recommendation

Add handler-level rate limiting and concurrency controls keyed by client identity/IP and normalized target host/URL. Consider requiring an authenticated session for composer-time metadata fetching, and keep CDN caching as an additional optimization rather than the only abuse control.

## Revalidation

**Verdict:** true-positive

The OG metadata route is an unauthenticated public GET handler that reads the url query parameter and delegates to OgMetadataController.fetch. There is no middleware/proxy file, and next.config.ts does not add rate limiting or concurrency controls for this route. OgMetadataValidators and the NextJsOgMetadataService do implement meaningful SSRF defenses: protocol checks, hostname checks, DNS safety checks, redirect validation, blocked private IP ranges, a five-redirect loop bound, 10 second fetch timeouts, and a 5MB streamed body limit. Those mitigations reduce SSRF impact but do not address endpoint abuse. The implementation has no server-side cache or deduplication even though comments mention caching; the only visible caching is client in-memory caching in useOgMetadata and CDN-oriented Cache-Control headers on successful responses. An attacker can vary query strings, paths, or hostnames to miss CDN cache entries and force fresh DNS resolution plus outbound fetch work. Each request can tie up server work and outbound network capacity until timeout or body limit, and the route accepts such requests without client identity, session, quota, or host-level throttling. This makes the reported unauthenticated resource-exhaustion and outbound-request abuse vector real.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-05-27)
- V <jovanovicv90@gmail.com> (2026-05-05)
- Taehwa Kim <hadeath03@gmail.com> (2026-03-12)
