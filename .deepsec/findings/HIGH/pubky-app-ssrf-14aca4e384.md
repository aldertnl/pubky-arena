# [HIGH] OG metadata fetch can bypass internal-address SSRF protections

**File:** [`src/core/controllers/og-metadata/og-metadata.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/controllers/og-metadata/og-metadata.ts#L26-L32) (lines 26, 32)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `ssrf`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

The controller accepts the public /api/og-metadata url parameter, validates only URL shape/protocol/hostname, then delegates the resulting URL into the server-side OG fetch path. The downstream SSRF guard checks DNS before calling fetch(), but it does not pin the resolved address used by fetch(), only checks the first IPv4 A record, and the IP allow/deny helper only blocks exact 127.0.0.1 rather than the full 127.0.0.0/8 loopback range. As a result, an attacker can use alternate loopback/reserved addresses such as 127.0.0.2, multiple-A-record ordering, or DNS rebinding between the pre-check and fetch to make the server request internal services. Redirect hops repeat the same incomplete check, so an allowed external URL can also redirect into a missed internal address. The endpoint returns extracted title/OG/image/media metadata, which can disclose internal response data and can trigger GET-side effects on internal services.

## Recommendation

Resolve and validate all A and AAAA records, block the full set of special-use IPv4/IPv6 ranges, and ensure the actual HTTP connection uses a validated pinned address or a custom lookup/dispatcher. Apply the same pinned validation on every redirect hop, and consider an allowlist or rate limiting for this public fetch endpoint.

## Revalidation

**Verdict:** true-positive

The API route reads the user-controlled url query parameter and passes it directly to OgMetadataController.fetch. The controller performs shape validation through OgMetadataValidators and then delegates the parsed URL to OgMetadataApplication.fetch; it does not add an ownership, auth, or address-range check itself. The validator allows HTTP and HTTPS IP-literal hostnames, leaving SSRF protection to the downstream Next.js service. That downstream service calls checkDnsSafety and then fetches the original URL, and checkDnsSafety ultimately relies on isIpSafe, which permits 127.0.0.0/8 addresses other than exact 127.0.0.1. I found no middleware file or route-level framework gate in front of /api/og-metadata. A concrete attacker-controlled request such as /api/og-metadata?url=http%3A%2F%2F127.1.1.1%3A<port>%2F therefore passes the controller and can make the server connect to loopback. The vulnerability is in the delegated guard rather than in controller layering alone, but the finding’s entry-point description is accurate and exploitable.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-05-27)
- V <jovanovicv90@gmail.com> (2026-05-05)
- Taehwa Kim <hadeath03@gmail.com> (2026-03-12)
