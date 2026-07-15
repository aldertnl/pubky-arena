# [MEDIUM] Recovery file encryption accepts empty or weak passphrases

**File:** [`src/libs/identity/identity.ts`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/libs/identity/identity.ts#L21-L23) (lines 21, 23)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `insecure-crypto`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

Identity.createRecoveryFile forwards the supplied passphrase directly to keypair.createRecoveryFile without enforcing that it is non-empty or meets any minimum strength. Tracing the callers shows ProfileController.createRecoveryFile passes the UI value through unchanged, and DialogBackupEncrypted currently treats matching fields as valid even when both are empty; its test suite explicitly asserts that an empty password downloads a recovery file. If a user creates a recovery.pkarr with an empty or weak passphrase and that file is later obtained from disk, downloads, or cloud backup, an attacker can attempt offline recovery of the Pubky private key with little or no passphrase entropy, leading to account takeover.

## Recommendation

Enforce passphrase policy in Identity.createRecoveryFile before calling the Pubky SDK, not only in UI. Reject empty and weak passphrases using the existing password/passphrase strength rules, update the backup dialog to disable submission until the same policy passes, and add tests that empty and short passphrases are rejected.

## Revalidation

**Verdict:** true-positive

I read `identity.ts` fully and `Identity.createRecoveryFile` performs no passphrase validation before calling `keypair.createRecoveryFile(passphrase)` and downloading `recovery.pkarr`. The type in `identity.types.ts` is only `passphrase: string`, with no branded or validated type. The only caller I found is `ProfileController.createRecoveryFile`, which reads the onboarding secret key, builds the keypair, and forwards the UI string unchanged. `DialogBackupEncrypted` calculates password strength and shows a warning, but `isFormValid` only checks that the two fields match, so two empty fields pass. Its test suite explicitly asserts that clicking download with empty fields calls `createRecoveryFile('')`. The Pubky SDK JS binding and types accept a plain string and expose no documented minimum, and the bundled WASM strings show Argon2 recovery-file code but no obvious empty or weak passphrase rejection. A concrete attack is theft of a downloaded or cloud-synced recovery file followed by offline guessing of an empty or common passphrase to recover the keypair.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- Taehwa Kim <hadeath03@gmail.com> (2026-04-03)
- tipogi <103417381+tipogi@users.noreply.github.com> (2026-01-21)
