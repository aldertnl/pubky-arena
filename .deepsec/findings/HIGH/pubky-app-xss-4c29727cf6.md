# [HIGH] External link policy lets unsafe URL schemes reach window.open

**File:** [`src/libs/utils/utils.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/libs/utils/utils.ts#L550-L557) (lines 550, 557)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** medium • **Slug:** `xss`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

shouldBypassLinkConfirmation only decides whether a link skips the confirmation dialog; it does not reject unsafe schemes. Its callers pass stored/public profile link URLs to window.open when link confirmation is disabled, and DialogCheckLink opens the same raw URL after the user continues. Profile link validation uses generic URL validation and the tests document that non-HTTP schemes are accepted. A malicious profile link such as a javascript: URL can therefore be stored in Nexus profile data and later passed to a browser navigation sink when another user clicks it.

## Recommendation

Centralize URL validation before rendering or opening external links. Allow only http:, https:, mailto:, and tel: as appropriate; reject or render other schemes inert. Use the same allowlist in profile validation and in the window.open/DialogCheckLink path, and make same-domain bypass require an allowed web protocol.

## Revalidation

**Verdict:** true-positive

The target utility defines only BYPASS_PROTOCOLS for mailto: and tel:, plus an isSameDomain hostname comparison, and shouldBypassLinkConfirmation returns a boolean about confirmation behavior only. It does not normalize or reject protocols, so an unsafe scheme is treated as a non-bypass external link rather than an invalid link. The hook caller interprets a false result as show the confirmation dialog, not block the link, and DialogCheckLink later opens the raw URL. When privacy.showConfirm is false, the hook opens the URL regardless of shouldBypassLinkConfirmation's result because of the || !checkLinkEnabled branch. The same-domain helper also does not enforce http: or https: as part of the policy, so this is not a central safe-link validator. ProfilePageLinks supplies user-controlled Nexus profile link.url values to this flow, and the profile validation/normalization path has no allowlist that would compensate. This finding is the policy-layer cause rather than the final sink, but the traced data flow makes it exploitable through the existing callers. It is not a duplicate under the provided rules because the primary sink finding is in a different file.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-22)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-03-25)
