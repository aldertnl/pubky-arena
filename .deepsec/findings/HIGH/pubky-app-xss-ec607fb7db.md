# [HIGH] Profile links can store unsafe javascript URLs

**File:** [`src/app/(edit-profile)/settings/edit/page.tsx`](<https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/app/(edit-profile)/settings/edit/page.tsx#L2-L10>) (lines 2, 10)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `xss`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The edit-profile page renders the profile editor, whose link URL validation only checks generic URL syntax downstream. `useProfileForm` uses `z.string().trim().url('Invalid URL')`, `DialogAddLink` uses the same style of schema, and `UserValidator` repeats the generic URL check without a protocol allowlist. Those values are normalized unchanged into profile links, then displayed by `ProfilePageLinks` as a literal anchor `href` and passed to `window.open()` through the link-confirmation flow. Because generic URL parsing accepts non-HTTP schemes such as `javascript:`, an authenticated attacker can save a malicious profile link and get script execution when another user activates it from the attacker's profile. The route guard and homeserver ownership checks protect who can edit a profile, but they do not sanitize the user-controlled link value before it is rendered to other users.

## Recommendation

Use a shared safe profile-link schema that allowlists intended schemes, for example `https:`, `http:`, `mailto:`, and `tel:` with scheme-specific validation. Apply it in the add-link dialog, edit form validation, final `UserValidator`, and again before rendering/opening stored Nexus links so legacy or malicious stored data is not trusted.

## Revalidation

**Verdict:** true-positive

The target page is only a wrapper around the EditProfile template, and that template renders EditProfileForm without adding any URL sanitization. The global route guard makes /settings/edit an authenticated route, so the attacker precondition is an authenticated user editing their own public profile, not anonymous profile modification. The save path in EditProfileForm goes through useProfileForm, whose live validation uses z.string().trim().url(), and final validation uses UserValidator with the same unrestricted URL check. Zod v4’s URL check uses new URL() and only constrains protocol when a protocol regex is supplied; this code supplies none, and project tests explicitly document that non-HTTP schemes such as ftp:// are accepted. DialogAddLink also uses the same unrestricted URL schema, while UserNormalizer maps the value to { title, url } and the profile application PUTs user.toJson() to homeserver storage without a project-local scheme allowlist. The specs package exposes only generic user-link URL format/length limits here, not the post attachment protocol allowlist used elsewhere. On display, React 19 does sanitize javascript: when assigning href, which reduces the raw anchor-default path, but ProfilePageLinks intercepts clicks and passes the stored raw URL to window.open through useLinkConfirmation/DialogCheckLink. That window.open sink is outside React’s href sanitizer and is reachable either after the confirmation dialog or directly when confirmation is disabled. A concrete attack is saving a javascript: profile link and inducing another user to activate it from the public profile link list.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- Miguel Medeiros <miguel@miguelmedeiros.com.br> (2025-12-05)
