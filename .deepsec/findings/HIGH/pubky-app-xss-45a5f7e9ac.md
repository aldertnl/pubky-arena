# [HIGH] External-link confirmation opens untrusted URLs without a safe-scheme allowlist

**File:** [`src/components/organisms/DialogCheckLink/DialogCheckLink.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/DialogCheckLink/DialogCheckLink.tsx#L39) (lines 39)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** medium • **Slug:** `xss`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

DialogCheckLink opens the caller-supplied linkUrl directly with window.open(). The component is used for public profile/article links, and profile links are rendered from Nexus-controlled user data. The related profile-link validation only uses generic URL parsing, not an explicit http/https/mailto/tel allowlist, and ProfilePageLinks also places the same raw value in href. An attacker-controlled profile link using an active scheme such as javascript: could be presented as a normal external link and then opened after the user clicks Continue, creating a click-triggered XSS/navigation sink. React text escaping protects the displayed URL, and noopener/noreferrer mitigates opener abuse, but neither validates the URL scheme.

## Recommendation

Centralize external URL normalization and only allow expected schemes before rendering hrefs or calling window.open. For web links, require http: or https:; handle mailto:/tel: only where explicitly intended; reject or render inert links for anything else. Apply the same allowlist in useLinkConfirmation/ProfilePageLinks and before DialogCheckLink continues.

## Revalidation

**Verdict:** true-positive

DialogCheckLink still calls window.open(linkUrl, '\_blank', 'noopener,noreferrer') directly in handleContinue with no URL parsing, normalization, or protocol allowlist. The component receives clickedLink from useLinkConfirmation, which stores the caller-supplied URL unchanged. ProfilePageLinks passes public Nexus profile link URLs into that hook and also assigns them directly to href. The default settings store has privacy.showConfirm set to true, so this dialog is the normal sink for external profile links; users who disable the confirmation hit the same raw window.open sink in useLinkConfirmation instead. noopener and noreferrer reduce opener/referrer exposure but do not make an unsafe URL scheme safe. The surrounding UI displays the URL as text safely, but display escaping is unrelated to the navigation sink. A malicious profile link can therefore reach this component and be opened after a user confirms, giving a click-triggered active-scheme navigation/script sink.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
