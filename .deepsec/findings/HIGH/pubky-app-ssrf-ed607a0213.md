# [HIGH] SSRF guard allows loopback addresses outside 127.0.0.1

**File:** [`src/libs/network/network.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/libs/network/network.ts#L23-L49) (lines 23, 37, 38, 39, 42, 49)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `ssrf`

## Owners

**Suggested assignee:** `85003930+secondl1ght@users.noreply.github.com` _(via last-committer)_

## Finding

The IP safety helper only blocks the exact loopback address 127.0.0.1, but the entire 127.0.0.0/8 range is loopback. This helper is used by the OG metadata fetch path: /api/og-metadata accepts a user-controlled url, the validator permits IP literals, checkDnsSafety passes IP literals directly to isIpSafe, and the Next.js service then server-side fetches the URL. An attacker can supply a URL such as http://127.1.1.1:<port>/ and pass this guard, causing the server to issue requests to loopback/internal services. The helper also leaves other special-use ranges underblocked, but the 127/8 gap alone is enough for a loopback SSRF bypass.

## Recommendation

Block the full RFC6890/special-use address space, including 127.0.0.0/8, 0.0.0.0/8, multicast, broadcast, reserved ranges, IPv6 loopback/link-local/ULA, and IPv4-mapped IPv6 forms. Prefer a well-tested IP parser or Node net.BlockList. In the OG metadata caller, validate every resolved address and avoid a DNS time-of-check/time-of-use gap by binding the fetch to the vetted resolution or using a resolver/dispatcher that enforces the same blocklist at connect time.

## Revalidation

**Verdict:** true-positive

At the requested checkout, isIpSafe only rejects the exact values 127.0.0.1, ::1, and 0.0.0.0 before parsing IPv4 octets. A host such as 127.1.1.1 parses as four valid octets and then avoids every explicit denied range, so the helper returns true. The repository tests confirm this is current behavior by asserting that 127.0.0.0, 127.1.1.1, and 127.255.255.255 are safe. checkDnsSafety uses this helper directly for IP-literal hostnames, so a URL using 127.1.1.1 does not get blocked before the OG metadata service fetches it. The public /api/og-metadata route exposes that flow to unauthenticated callers. Protocol validation limits the primitive to HTTP(S), and metadata extraction returns only constrained fields rather than an arbitrary response body, but the server can still reach loopback services and disclose title/OG/media metadata or cause GET side effects. This is real and exploitable, but I would rate it HIGH rather than CRITICAL because the response channel is limited and common link-local metadata addresses are separately blocked.

## Recent committers (`git log`)

- secondl1ght <85003930+secondl1ght@users.noreply.github.com> (2025-11-26)
