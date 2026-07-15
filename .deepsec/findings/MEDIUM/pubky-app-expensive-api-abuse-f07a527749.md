# [MEDIUM] Public post rendering can amplify server-side OG metadata fetches

**File:** [`src/components/organisms/PostMain/PostMain.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/PostMain/PostMain.tsx#L100-L137) (lines 100, 137)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `expensive-api-abuse`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

PostMain renders PostContent for public post cards at lines 100 and 137. Following that data flow, PostContentBase renders PostLinkEmbeds for attacker-controlled post content; generic links render GenericPreview, whose useOgMetadata calls the public /api/og-metadata?url=... endpoint. The endpoint has SSRF defenses, including HTTP/HTTPS validation, DNS/private-IP checks, manual redirect validation, timeout, and a 5 MB body cap. However, I found no application-level rate limit or persistent cross-client deduplication: the client cache is per browser and the CDN cache is keyed by the full URL. An attacker can publish posts with high-cardinality public URLs so each viewer's browser causes the app server to make outbound requests, consuming server egress/worker time and potentially generating unwanted traffic to third-party targets. This is not an internal-network SSRF finding; it is a server-side request abuse/rate-limiting gap in the preview-rendering path.

## Recommendation

Add server-side rate limiting or quotas and durable normalized-URL caching for /api/og-metadata. Consider lazy-loading previews on explicit user action or restricting automatic preview fetches in public timelines. Keep the existing SSRF validation in place.

## Revalidation

**Verdict:** true-positive

The reported render path is present: PostMain renders PostContent, PostContentBase renders PostLinkEmbeds for non-article/non-collection post text, Generic renders GenericPreview, and GenericPreview calls useOgMetadata. useOgMetadata automatically fetches `/api/og-metadata?url=...` for the first generic link and only caches in a browser-local in-memory Map keyed by the exact API URL for one hour. The server route validates protocol/host, checks DNS/private IPs, manually validates redirects, has a 10 second fetch timeout, and caps HTML response bodies at 5 MB, so this is not an SSRF finding. The route does return `Cache-Control: public, s-maxage=300, stale-while-revalidate=1800` for successful responses, but that is still keyed by the full request URL and does not stop high-cardinality attacker-controlled URLs from forcing new outbound server fetches. I found no Next middleware, route-local limiter, CAPTCHA, quota, durable normalized URL cache, or abuse token protecting this endpoint. A concrete attacker can publish many public posts with unique generic HTTP(S) URLs, causing each viewer's browser to trigger same-origin API calls that make the app server fetch attacker-chosen third-party URLs. The existing defenses reduce SSRF and per-request blast radius, but they do not prevent server-side request/egress amplification through public timeline rendering.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-07-08)
- John R Serrano Perez <john.voiden@gmail.com> (2026-05-19)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-05-08)
