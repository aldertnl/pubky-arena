# [MEDIUM] Encrypted recovery backup accepts empty or weak passphrases

**File:** [`src/app/onboarding/backup/page.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/app/onboarding/backup/page.tsx#L10) (lines 10)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `insecure-crypto`

## Owners

**Suggested assignee:** `jovanovicv90@gmail.com` _(via last-committer)_

## Finding

This page renders the onboarding backup template, which exposes the encrypted recovery-file dialog. In the imported DialogBackupEncrypted flow, PASSPHRASE_MIN_LENGTH only controls warning styling; the submit guard accepts any matching values, including two empty strings or very short passphrases, and then passes that passphrase directly to ProfileController.createRecoveryFile. If a generated recovery.pkarr file is later obtained by an attacker, an empty or weak passphrase can be guessed or brute-forced to recover the user's Pubky key.

## Recommendation

Require a non-empty passphrase that meets PASSPHRASE_MIN_LENGTH and a minimum strength before enabling the download action or Enter-key submit path. Add tests proving empty and short matching passphrases do not call createRecoveryFile.

## Revalidation

**Verdict:** true-positive

The page renders BackupPage, which renders BackupMethodCard, which exposes DialogBackupEncrypted for the encrypted recovery-file flow. In RecoveryStep1, both passphrase and confirmPassphrase start as empty strings, so passphraseMatch is true on initial render. isFormValid returns only passphraseMatch, which means the download button is enabled when both fields are empty and also for any matching short value. The Enter-key path uses the same isFormValid guard through useEnterSubmit, so keyboard submission has the same weakness. PASSPHRASE_MIN_LENGTH and calculatePasswordStrength only drive warning text and strength UI; they are not enforced before handleDownload runs. handleDownload calls ProfileController.createRecoveryFile(passphrase), and ProfileController passes that value through Identity.createRecoveryFile to keypair.createRecoveryFile. The installed @synonymdev/pubky wrapper accepts a string passphrase and passes it directly to WASM, with no JavaScript-side minimum length check. The existing DialogBackupEncrypted test suite even includes a test named allows download with empty password when both fields match, confirming the current intended behavior. If an attacker later obtains recovery.pkarr, an empty or very weak passphrase materially reduces the recovery-file encryption to an offline guessing problem.

## Recent committers (`git log`)

- V <jovanovicv90@gmail.com> (2026-05-05)
- Flavio <moceri.flavio@gmail.com> (2025-09-01)
- Miguel Medeiros <miguel@miguelmedeiros.com.br> (2025-08-26)
