# [HIGH] Recovery phrase sign-in can log the derived keypair

**File:** [`src/components/organisms/DialogRestoreRecoveryPhrase/DialogRestoreRecoveryPhrase.tsx`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/src/components/organisms/DialogRestoreRecoveryPhrase/DialogRestoreRecoveryPhrase.tsx#L48-L50) (lines 48, 49, 50)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `secret-in-log`

## Owners

**Suggested assignee:** `john.voiden@gmail.com` _(via last-committer)_

## Finding

The dialog joins the entered recovery words into a mnemonic and passes it to AuthController.loginWithMnemonic. That controller derives a Pubky Keypair from the mnemonic and, if AuthApplication.signIn returns undefined, logs Logger.error('Failed to sign in. Please try again.', { keypair }) in src/core/controllers/auth/auth.ts. Logger.error always writes in non-test environments, so a failed restore path can expose private key material derived from the user's recovery phrase to browser/server logs and potentially log collectors or support captures. Sentry scrubbing does not prevent the raw console log itself.

## Recommendation

Never log Keypair, secret keys, mnemonics, session exports, or objects containing them. Replace the log context with a non-sensitive public identifier such as Identity.pubkyFromKeypair(keypair), or omit context entirely, and add a regression test that the undefined sign-in path does not log secret-bearing objects.

## Revalidation

**Verdict:** true-positive

The dialog joins the 12 entered recovery words into a mnemonic and passes it to AuthController.loginWithMnemonic. That controller derives a Pubky Keypair with Identity.keypairFromMnemonic and then calls the private AuthController.signIn helper. AuthController.signIn still logs Logger.error('Failed to sign in. Please try again.', { keypair }) when AuthApplication.signIn returns undefined. HomeserverService.signIn documents and implements that undefined return after it catches a sign-in failure and successfully republishes the homeserver record, so this branch is reachable for a valid derived keypair. Logger.error always logs in non-test environments and sends the object to console output before any Sentry scrubbing could matter. The Pubky Keypair wrapper exposes a secret() method, so logging the live object is logging a secret-bearing capability even if the console's default preview may show only wrapper internals. A concrete exposure scenario is a failed recovery attempt on the republish path where browser console capture, support tooling, or a patched console logger retains the keypair object and can recover the private seed bytes.

## Recent committers (`git log`)

- John R Serrano Perez <john.voiden@gmail.com> (2026-06-15)
- V <jovanovicv90@gmail.com> (2026-05-05)
