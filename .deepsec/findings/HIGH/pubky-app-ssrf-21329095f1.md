# [HIGH] OG metadata fetch can reach loopback addresses via incomplete IP blocking

**File:** [`src/core/pipes/og-metadata/og-metadata.validators.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/pipes/og-metadata/og-metadata.validators.ts#L72-L73) (lines 72, 73)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `ssrf`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

The validator accepts IP-address hostnames and skips domain-structure checks for them. Tracing the validated URL through OgMetadataController to NextJsOgMetadataService shows the intended SSRF mitigation is checkDnsSafety/isIpSafe, but src/libs/network/network.ts only blocks the exact loopback address 127.0.0.1, not the full 127.0.0.0/8 loopback range, and checkDnsSafety accepts direct IP hosts after that single isIpSafe call. As a result, an unauthenticated /api/og-metadata request with a URL such as a 127.x.x.x loopback address would pass validation and be fetched server-side, allowing SSRF to local/internal services. The DNS helper also validates only the first A record, which leaves additional multi-record/rebinding risk.

## Recommendation

Block the full loopback range and other private/reserved IPv4 ranges in isIpSafe, validate every resolved DNS address instead of only the first, and avoid the DNS-check/fetch re-resolution gap where possible. Add regression tests for 127.0.0.0/8 and mixed public/private DNS answers.

## Revalidation

**Verdict:** true-positive

OgMetadataValidators.validateSafe trims and parses the supplied URL, requires only http: or https:, and then validates hostname shape. For IP addresses and localhost, validateHostnameSafe explicitly skips domain/TLD checks and returns success. That is not inherently unsafe for public IPs, but it means direct IP literals such as 127.1.1.1 are allowed to reach the downstream SSRF guard. The downstream checkDnsSafety path treats IP literals as already resolved and calls isIpSafe, whose current implementation only blocks exact 127.0.0.1 rather than the full 127.0.0.0/8 loopback range. After that check succeeds, NextJsOgMetadataService fetches the original URL server-side. The validator does block non-HTTP schemes and .onion names, but those mitigations do not address the loopback IP-literal case. Therefore the finding is real when traced end to end through the controller, application, and Next.js service.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-05-27)
- V <jovanovicv90@gmail.com> (2026-05-05)
- Taehwa Kim <hadeath03@gmail.com> (2026-03-12)
