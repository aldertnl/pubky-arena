# [HIGH] Profile links accept executable URL schemes

**File:** [`src/components/organisms/CreateProfileForm/CreateProfileForm.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/CreateProfileForm/CreateProfileForm.tsx#L30-L131) (lines 30, 104, 118, 131)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `xss`

## Owners

**Suggested assignee:** `john.voiden@gmail.com` _(via last-committer)_

## Finding

CreateProfileForm wires profile link inputs into the shared profile form state and validation, then accepts new links from DialogAddLink into that state. The shared form validator uses an unrestricted Zod URL check (`z.string().trim().url()` in useProfileForm, with the same pattern in UserValidator), which validates any WHATWG URL scheme rather than an explicit safe allowlist. Saved profile links are later rendered directly as `<a href={link.url}>` in ProfilePageLinks and passed to `window.open(linkUrl, '_blank', 'noopener,noreferrer')` by useLinkConfirmation/DialogCheckLink. An attacker can create a profile link such as a `javascript:` URL; when another user clicks that public profile link and continues past the confirmation dialog, script can execute in the app context. React text escaping does not mitigate this because the sink is the URL scheme in href/window.open, not HTML text.

## Recommendation

Use one centralized profile-link URL schema that allowlists only intended safe schemes, preferably http/https and only mailto/tel if explicitly supported. Apply the same allowlist in useProfileForm, DialogAddLink, UserValidator, and before rendering/opening links in ProfilePageLinks/useLinkConfirmation. Reject or ignore existing stored links with disallowed schemes.

## Revalidation

**Verdict:** true-positive

CreateProfileForm wires both the default link inputs and DialogAddLink into the shared useProfileForm state, and it does not impose any additional protocol policy before submission. Edited link inputs call handlers.validateLinkUrl, which uses z.string().trim().url(), and newly added links come from DialogAddLink, which uses the same generic URL validator with only a max-length check. The final submit path calls UserValidator.check, and UserValidator repeats z.string().trim().url() for each non-empty link URL. Zod v4’s implementation uses new URL() without an allowlist unless a protocol constraint is passed, and this project’s own UserValidator tests note that Zod URL validation accepts protocols beyond http/https. After validation, ProfileController/UserNormalizer convert label to title and preserve the url value into the profile object that is written to homeserver storage. I did not find a later project-local sanitizer or render-time allowlist that rejects legacy or malicious stored schemes. React’s href sanitizer blocks direct javascript: href assignment in React 19, but the public ProfilePageLinks click flow still calls window.open with the raw stored URL. Therefore a malicious profile created during onboarding can store an executable scheme and expose it to other users when they activate the profile link.

## Recent committers (`git log`)

- John R Serrano Perez <john.voiden@gmail.com> (2026-07-01)
- V <jovanovicv90@gmail.com> (2026-05-05)
