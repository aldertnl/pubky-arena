# [HIGH] Profile link validation allows active URL schemes

**File:** [`src/hooks/useProfileForm/useProfileForm.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/hooks/useProfileForm/useProfileForm.tsx#L27-L329) (lines 27, 139, 149, 318, 329)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `xss`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

Profile links are validated only with a generic URL parser in this hook (`z.string().trim().url(...)`) and then submitted to the profile write path. That validation accepts non-HTTP schemes such as `javascript:` because they are syntactically valid URLs. The final `UserValidator.check(...)` path uses the same generic URL validation, and rendered profiles later place stored link URLs directly in an anchor `href` in `ProfilePageLinks` and pass the same URL to `window.open` through the link-confirmation flow. An attacker can publish a public profile link with an active scheme and get script execution when another user activates that link.

## Recommendation

Replace generic URL validation for profile links with an explicit protocol allowlist. Prefer `https:` and `http:` only unless `mailto:` and `tel:` are intentionally supported; reject `javascript:`, `data:`, `file:`, `blob:`, and protocol-relative URLs. Reuse the same validator in `useProfileForm`, `UserValidator`, and the add-link dialog, and consider enforcing safe schemes again at render/open time before assigning `href` or calling `window.open`.

## Revalidation

**Verdict:** true-positive

The current file still defines profile link validation as z.string().trim().url('Invalid URL'), and UserValidator.check uses the same permissive URL validator for the final form submission path. In installed Zod 4, url() delegates to new URL() without a protocol allowlist unless httpUrl() or an explicit protocol option is used, so syntactically valid non-HTTP schemes are not rejected. DialogAddLink uses the same generic URL validation before adding custom profile links. ProfileController.commitCreate and commitUpdate pass these links through UserNormalizer.linksFromUi without normalizing or filtering schemes before writing the profile. On the read/render side, ProfilePageLinks maps Nexus-controlled link.url directly into href and into useLinkConfirmation. That hook only bypasses confirmation for mailto:, tel:, or same-domain URLs; it does not reject javascript:, data:, file:, blob:, or ftp:. With default settings privacy.showConfirm is true, the raw URL is passed into DialogCheckLink and opened after the user clicks Continue; if confirmation is disabled, useLinkConfirmation calls window.open directly. A concrete attack is an attacker publishing a profile link with an active scheme and inducing another user to activate it from the public profile links UI.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-07-09)
- John R Serrano Perez <john.voiden@gmail.com> (2026-06-15)
