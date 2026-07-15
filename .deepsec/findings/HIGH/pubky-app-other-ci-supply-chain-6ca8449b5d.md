# [HIGH] Cloud Run deployment uses mutable third-party action refs with cloud credentials

**File:** [`.github/workflows/preview-deploy.yml`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/.github/workflows/preview-deploy.yml#L85-L151) (lines 85, 87, 99, 106, 115, 146, 148, 151)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `other-ci-supply-chain`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

The deploy and cleanup jobs authenticate to GCP with CLOUD_RUN_SA_KEY, then run actions pinned only to major tags. Any compromise or retagging of google-github-actions/auth, deploy-cloudrun, setup-gcloud, or the later comment actions in the same authenticated job could exfiltrate cloud credentials or manipulate preview deployments.

## Recommendation

Pin all third-party actions to full commit SHAs and isolate cloud authentication so no unnecessary actions run after credentials are available.

## Revalidation

**Verdict:** true-positive

The deploy and cleanup jobs use google-github-actions/auth@v2 with secrets.CLOUD_RUN_SA_KEY, and the action reference is a mutable major tag. In the deploy job, google-github-actions/deploy-cloudrun@v2 runs after authentication and can use the generated credentials/environment. The peter-evans find-comment and create-or-update-comment actions also run later in the same authenticated job, so a compromised action could read ambient credential files or environment variables created by the auth action. In cleanup, google-github-actions/setup-gcloud@v2 runs after authentication and before the gcloud deletion step. These are all mutable action references rather than reviewed immutable SHAs. A compromise or retag of any of those actions would execute attacker-controlled code in a job with cloud deployment or cleanup authority. There is no job boundary that removes cloud credentials before later third-party actions execute.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-30)
- SpontaneousOverthrow <v.rodionov@protonmail.com> (2026-06-01)
