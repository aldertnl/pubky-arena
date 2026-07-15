# [HIGH] OG metadata SSRF guard can be bypassed before server-side fetch

**File:** [`src/core/services/nextjs/og-metadata/og-metadata.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/services/nextjs/og-metadata/og-metadata.ts#L45-L236) (lines 45, 54, 156, 236)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `ssrf`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

The public OG metadata flow validates DNS before fetching, but it does not validate the actual address used by fetch(). The service calls checkDnsSafety() on the hostname, then later calls fetch(url) with the original URL; redirects repeat the same preflight pattern. The imported IP guard only blocks the exact loopback address 127.0.0.1, not the full 127.0.0.0/8 loopback range, so a direct URL such as http://127.1.1.1:<port>/ passes the safety check and is fetched server-side. For hostnames, checkDnsSafety() performs a separate DNS lookup from fetch(), so attacker-controlled DNS can pass validation with a public address and then resolve to loopback/private infrastructure when fetch connects. The validator also only checks IPv4 A records, while fetch may use a different address family/order. Because /api/og-metadata is unauthenticated and user-controlled, this can reach internal or loopback services.

## Recommendation

Validate the actual remote address used for the connection. Block the entire non-global address space, including 127.0.0.0/8, 0.0.0.0/8, RFC1918, link-local, multicast, reserved, and unsafe IPv6 ranges. Resolve and validate all A/AAAA answers, pin the validated address for the outbound connection with a custom lookup/agent or equivalent, and apply the same logic on every redirect hop.

## Revalidation

**Verdict:** true-positive

NextJsOgMetadataService.fetch first calls checkDnsSafety on validatedUrl.hostname and then separately calls fetchWithRedirectsForOgMetadata with the original URL string. For an IP literal such as 127.1.1.1, checkDnsSafety skips DNS, passes the hostname to isIpSafe, and receives ok because only exact 127.0.0.1 is denied. fetchForOgMetadata then calls the platform fetch with that same loopback URL. For DNS names, the service also validates only a preflight resolution: checkDnsSafety resolves only IPv4 A records, uses only addresses[0], and does not pin that address for the later fetch. Redirect hops repeat the same incomplete check before updating currentUrl, so redirects into missed loopback addresses are also possible. The response processing imposes a timeout, manual redirect limit, content-type checks, and a 5MB body cap, but none of those prevent the outbound internal request. This is a real SSRF primitive through a public endpoint; I rate it HIGH rather than CRITICAL because exfiltration is limited to extracted metadata and media classification rather than arbitrary raw response bodies.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-05-27)
- V <jovanovicv90@gmail.com> (2026-05-05)
- Taehwa Kim <hadeath03@gmail.com> (2026-03-12)
