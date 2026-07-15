# [HIGH] Profile links allow dangerous URL schemes

**File:** [`src/components/organisms/Settings/EditProfileForm/EditProfileForm.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/Settings/EditProfileForm/EditProfileForm.tsx#L106-L132) (lines 106, 120, 132)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `xss`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The edit profile form accepts and saves arbitrary syntactically valid URLs for profile links. The URL is edited in this component and validated through useProfileForm/UserValidator with only zod .url() checks, which do not enforce an http/https allowlist. Saved profile links are later rendered as raw anchor href values in ProfilePageLinks and opened via window.open in useLinkConfirmation/DialogCheckLink. An attacker can set a public profile link such as a javascript: URL; when another user clicks it, attacker-controlled script can execute in the app context after the link confirmation flow or directly if confirmation is disabled.

## Recommendation

Use a shared safe profile-link schema that explicitly allowlists intended protocols, preferably http: and https: only unless mailto:/tel: are intentionally supported. Apply it in DialogAddLink, useProfileForm, and UserValidator, and make the render/open path refuse non-allowlisted protocols before assigning href or calling window.open.

## Revalidation

**Verdict:** true-positive

EditProfileForm loads existing Nexus profile links into local form state as { label, url } and lets the user edit or add links without any local scheme allowlist. For edited links it calls handlers.validateLinkUrl from useProfileForm, which is backed by z.string().trim().url(), and DialogAddLink uses the same unrestricted URL validation for new links. On save, useProfileForm calls UserValidator.check, which again validates link URLs only with z.string().trim().url(). The profile controller then maps the values with UserNormalizer.linksFromUi and the application writes the resulting user JSON to homeserver storage; I found no sanitization or protocol filtering in that path. Zod v4 supports protocol constraints, but none are supplied here, and local tests explicitly acknowledge acceptance of non-HTTP URL schemes. The public rendering path transforms Nexus links back into ProfilePageLinks and passes link.url to both href and the click-confirmation flow. React 19 mitigates the literal href javascript: case by sanitizing the attribute, but the raw value still reaches window.open in useLinkConfirmation/DialogCheckLink. An authenticated attacker can therefore update their public profile with a javascript: link and rely on another user clicking through the profile link UI to reach the executable sink.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
