# [MEDIUM] Recovery file can be created with an empty or weak passphrase

**File:** [`src/components/organisms/DialogBackupEncrypted/DialogBackupEncrypted.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/DialogBackupEncrypted/DialogBackupEncrypted.tsx#L54-L168) (lines 54, 55, 57, 58, 60, 61, 64, 65, 168)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `insecure-crypto`

## Owners

**Suggested assignee:** `74595920+catch-21@users.noreply.github.com` _(via last-committer)_

## Finding

The encrypted recovery-file flow initializes both passphrase fields to empty strings, computes `passphraseMatch` as simple equality, and treats the form as valid whenever the two fields match. Because `isFormValid()` only returns `passphraseMatch`, the download button is enabled on initial render and `handleDownload()` passes the empty string directly to `ProfileController.createRecoveryFile(passphrase)`, which ultimately calls `keypair.createRecoveryFile(passphrase)`. `PASSPHRASE_MIN_LENGTH` is only used to color warning text, not to block export. A user can therefore create a private-key recovery file protected by an empty or trivially weak passphrase; anyone who later obtains that file can decrypt it or brute-force it offline and take over the Pubky identity. The existing test suite also codifies this behavior by asserting that empty-password download is allowed.

## Recommendation

Require a non-empty passphrase and enforce a minimum length/strength before enabling download or handling Enter submission. Add the same validation in `ProfileController.createRecoveryFile` or `Identity.createRecoveryFile` as defense in depth, and update tests to assert empty and weak passphrases are rejected.

## Revalidation

**Verdict:** true-positive

The component initializes both `passphrase` and `confirmPassphrase` to empty strings, computes validity as `passphrase === confirmPassphrase`, and `isFormValid()` returns only that equality check. On initial render the two empty fields match, so the download button is not disabled, and pressing Enter in either field would also pass `useEnterSubmit()` because the validity function returns true. `handleDownload()` passes the raw `passphrase` directly to `ProfileController.createRecoveryFile(passphrase)`, so an empty string or any trivially weak matching string reaches the controller. `ProfileController.createRecoveryFile()` loads the onboarding secret key, builds a keypair, and forwards the same passphrase to `Identity.createRecoveryFile()` with no validation. `Identity.createRecoveryFile()` calls `keypair.createRecoveryFile(passphrase)` directly; the installed SDK type accepts a plain string and the local wrapper adds no minimum length or strength check. `PASSPHRASE_MIN_LENGTH` and `calculatePasswordStrength()` only drive warning/strength UI, and the minimum-length warning is not part of the validity condition. The test suite currently codifies the vulnerable behavior with a test named `allows download with empty password when both fields match`, asserting the controller is called with `''`. The concrete exploit is offline compromise: anyone who later obtains a recovery file created with an empty or weak passphrase can decrypt or brute-force it and recover the Pubky identity's private key material.

## Recent committers (`git log`)

- James <74595920+catch-21@users.noreply.github.com> (2026-05-14)
- V <jovanovicv90@gmail.com> (2026-05-05)
