# [CRITICAL] OG metadata SSRF guard can be bypassed for loopback and rebinding cases

**File:** [`src/core/services/nextjs/nextjs.utils.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/services/nextjs/nextjs.utils.ts#L48-L67) (lines 48, 51, 52, 67)
**Project:** pubky-app
**Severity:** CRITICAL • **Confidence:** high • **Slug:** `ssrf`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

The public /api/og-metadata route accepts a user-controlled URL and eventually fetches it server-side. checkDnsSafety trusts literal IP hostnames and otherwise validates only addresses[0] from dns.resolve4 before a later fetch resolves the hostname independently. The imported isIpSafe helper only blocks the exact IPv4 loopback 127.0.0.1, so other 127.0.0.0/8 loopback addresses such as 127.0.0.2 pass the safety check and can be fetched. The first-address-only DNS check also leaves the guard vulnerable to multi-answer/DNS-rebinding scenarios because the vetted address is not necessarily the address used by fetch. This can let a remote attacker make the server contact loopback or internal services despite the intended SSRF protection.

## Recommendation

Block all special-use/private/non-global IP ranges, including 127.0.0.0/8, 0.0.0.0/8, multicast, reserved ranges, IPv4-mapped IPv6, and private/link-local IPv6. Validate every resolved A and AAAA record, and avoid DNS rebinding by pinning the outbound request to a vetted resolved address or using a fetch/dispatcher/proxy that enforces the checked remote address.

## Revalidation

**Verdict:** true-positive

The current code still matches the reported vulnerable shape: checkDnsSafety treats IP literals as already resolved and otherwise calls dns.resolve4(hostname), then validates only addresses[0]. The imported isIpSafe only rejects exact 127.0.0.1, ::1, and 0.0.0.0 before checking a few private IPv4 ranges; project tests explicitly assert that 127.1.1.1 and other 127/8 addresses are currently considered safe. The OG controller/validator allows HTTP(S) URLs with IP literal hostnames and localhost through the pipe, leaving DNS/IP safety to this helper. NextJsOgMetadataService then calls fetch(url, { redirect: 'manual' }) after the separate DNS check, with no pinned resolved address or custom lookup that enforces the vetted address at connection time. A concrete attack is a request to /api/og-metadata with a URL such as http://127.0.0.2:<port>/, which passes isIpSafe and causes the server-side fetch path to contact loopback. The first-address-only DNS behavior is also a real rebinding/round-robin weakness because the checked A record is not guaranteed to be the one fetch later connects to, and AAAA records are not checked at all. Redirect handling repeats the same flawed check on each redirect target, so it does not close the bypass. I found no middleware or route-level authentication that would prevent public access to the API route. This is real and exploitable as an SSRF primitive.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-05-27)
- V <jovanovicv90@gmail.com> (2026-05-05)
- Taehwa Kim <hadeath03@gmail.com> (2026-03-12)
