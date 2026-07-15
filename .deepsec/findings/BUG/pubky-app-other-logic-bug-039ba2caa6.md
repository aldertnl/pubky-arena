# [BUG] Valid pubky identifiers beginning with pubky cannot be muted

**File:** [`src/core/pipes/mute/mute.normalizer.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/core/pipes/mute/mute.normalizer.ts#L17) (lines 17)
**Project:** pubky-app
**Severity:** BUG • **Confidence:** high • **Slug:** `other-logic-bug`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

The normalizer strips any mutee string that starts with the literal prefix pubky before passing it to pubky-app-specs. Raw Pubky identifiers can legitimately begin with those characters, so such a key is truncated and then rejected by createMute, making that user impossible to mute through this path.

## Recommendation

Make prefix stripping delimiter-aware. Strip only unambiguous formats such as pk: or parsed pubky:// URIs, or validate the raw identifier before applying compact-prefix normalization.

## Revalidation

**Verdict:** true-positive

MuteNormalizer.to has the same delimiter-blind normalization pattern as the follow normalizer: it calls stripPubkyPrefix on the target ID before builder.createMute. The shared helper strips any leading pubky literal, even when that text is part of a raw 52-character z-base32 identifier rather than a display prefix. MuteController.commitMute also applies the helper before calling the pipe, so both the local muted-stream key and the homeserver mute URL/body are based on the truncated value. pubky-app-specs documents mutes as /pub/pubky.app/mutes/:user_id and createMute takes the raw mutee ID, so a 47-character truncated value cannot represent the intended user. The normal UI path useMuteUser reaches MuteController.commitMute, making this a reachable bug. A user whose raw Pubky ID starts with pubky would be impossible to mute through this path, and a determined abusive user could plausibly grind for such a prefix to exploit the mute-evasion effect. This remains a bug-level finding rather than an ownership bypass or secret exposure.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- Kevin Karsopawiro <k.karsopawiro@gmail.com> (2026-01-27)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
