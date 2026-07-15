# [BUG] Valid pubky identifiers beginning with pubky cannot be followed

**File:** [`src/core/pipes/follow/follow.normalizer.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/pipes/follow/follow.normalizer.ts#L17) (lines 17)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-logic-bug`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The normalizer strips any followee string that starts with the literal prefix pubky before passing it to pubky-app-specs. Raw Pubky identifiers can legitimately begin with those characters, so such a key is truncated and then rejected by createFollow, making that user impossible to follow through this path.

## Recommendation

Make prefix stripping delimiter-aware. Strip only unambiguous formats such as pk: or parsed pubky:// URIs, or validate the raw identifier before applying compact-prefix normalization.

## Revalidation

**Verdict:** true-positive

The finding is still present: FollowNormalizer.to calls stripPubkyPrefix before builder.createFollow. The helper in src/libs/utils/utils.ts strips any string starting with the literal pubky prefix, without checking whether it is a display-form prefix or a raw 52-character z-base32 key. The controller also pre-normalizes followee with the same helper before calling the normalizer, so the raw key is already truncated before local state or homeserver URL creation. The Pubky SDK docs distinguish display IDs from raw z32 IDs, and pubky-app-specs createFollow expects the raw target ID used in /pub/pubky.app/follows/:user_id. A raw valid key beginning with the letters pubky would become a 47-character invalid value and createFollow would reject it; there is no later validation or parsing step that can restore the lost prefix. This is reachable from normal follow flows such as useFollowUser through UserController.commitFollow. The impact is a real availability/UX bug for following such identities, not a cross-user write or privilege escalation.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- Kevin Karsopawiro <k.karsopawiro@gmail.com> (2026-01-27)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
