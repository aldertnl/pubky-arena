# [HIGH] Rendered post links can trigger loopback SSRF through OG metadata fetching

**File:** [`src/components/organisms/Timeline/Posts/GridPosts/GridPosts.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/Timeline/Posts/GridPosts/GridPosts.tsx#L121) (lines 121)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `ssrf`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

GridPosts renders PostMain for public post IDs, which loads user-controlled post content and PostLinkEmbeds. Generic links in that content call /api/og-metadata, whose server-side fetch guard validates the hostname with checkDnsSafety and isIpSafe. isIpSafe only blocks the exact loopback address 127.0.0.1, allowing other 127.0.0.0/8 loopback addresses such as 127.0.0.2. A malicious public post containing such a URL can cause viewers' browsers to trigger the app server to fetch loopback/internal HTTP services and return metadata or cause GET side effects.

## Recommendation

Fix the OG metadata SSRF guard by blocking the full 127.0.0.0/8 range and other RFC6890 special-use ranges, validating all resolved A/AAAA records, and avoiding DNS rebinding by binding fetches to validated addresses or checking the connected remote address. Add regression tests for 127.0.0.2, IPv4-mapped variants, and multi-record DNS responses.

## Revalidation

**Verdict:** true-positive

GridPosts maps each supplied postId to PostMain, and PostMain loads post details through usePostDetails. That hook uses PostController.fetch on cache miss, which fetches public post data from Nexus and does not require a restored current session. PostContentBase renders PostLinkEmbeds for non-empty post content, and PostLinkEmbeds parses the first URL in that user-controlled content. For generic links, ProviderGeneric renders GenericPreview, whose useOgMetadata hook automatically issues fetch(`/api/og-metadata?url=${encodeURIComponent(url)}`) when the component mounts. There is no client-side filter that blocks 127.0.0.0/8 URLs before this API call. Because the server-side OG metadata guard permits addresses like 127.1.1.1, a malicious public post containing such a URL can cause viewers who render the grid card to trigger a same-origin request that makes the app server contact loopback. This is a stored/client-triggered path to the same SSRF, and the direct public API remains exploitable as well.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-06-30)
