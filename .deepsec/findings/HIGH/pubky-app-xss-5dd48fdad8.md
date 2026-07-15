# [HIGH] Profile links can open unsafe URL schemes

**File:** [`src/hooks/useLinkConfirmation/useLinkConfirmation.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/hooks/useLinkConfirmation/useLinkConfirmation.ts#L47-L58) (lines 47, 52, 53, 58)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `xss`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

handleLinkClick accepts an arbitrary URL string and either opens it directly when confirmation is disabled or stores it for DialogCheckLink, which later opens the same string with window.open. The hook only decides whether to show a confirmation dialog; it never enforces an allowed protocol. This is reachable from user-controlled profile links rendered by ProfilePageLinks, where Nexus link.url is used as href and passed into this hook. The profile creation/edit validators use Zod's generic url() check, and the repo tests explicitly note that non-http(s) protocols are accepted. An attacker who publishes a profile link such as a javascript: URL could get that unsafe scheme rendered and opened when a victim clicks the link, especially if the victim disabled confirmations or accepts the dialog.

## Recommendation

Add a central safe-link validator before rendering and before window.open. Allow only expected schemes such as http:, https:, mailto:, and tel:, normalize case/whitespace, and reject javascript:, data:, file:, blob:, and other schemes. Apply the same protocol allowlist in profile-link validation and add regression tests for unsafe and mixed-case schemes.

## Revalidation

**Verdict:** true-positive

The target hook reads the URL string supplied by the caller and either passes it directly to window.open when confirmation is disabled or stores the same raw string in clickedLink when confirmation is enabled. ProfilePageLinks maps Nexus profile link.url directly into both the anchor href and handleLinkClick argument, with no scheme filtering before rendering. DialogCheckLink then opens the stored linkUrl with window.open when the user clicks Continue, again without validation. The default setting has confirmation enabled, but this only adds a user prompt; it does not reject javascript:, data:, file:, blob:, or other dangerous schemes, and users can disable the prompt through the dialog. The profile form path also uses generic URL validation and UserNormalizer copies the submitted URL into the homeserver profile payload without a protocol allowlist. Even if a UI validator were tightened later, a malicious Pubky identity can publish profile data directly and Nexus returns links as plain strings. A concrete attack is an attacker publishing a profile link whose URL is a javascript: URL, then getting a victim to click or accept the confirmation; the string reaches a browser navigation sink. The use of noopener/noreferrer reduces opener abuse but does not make arbitrary URL schemes safe to navigate. No current code in this path mitigates the unsafe scheme issue.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- secondl1ght <85003930+secondl1ght@users.noreply.github.com> (2026-03-26)
