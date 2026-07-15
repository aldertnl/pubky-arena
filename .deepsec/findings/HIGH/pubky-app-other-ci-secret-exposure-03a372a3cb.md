# [HIGH] Caller-selected refs are built with registry and Sentry secrets

**File:** [`.github/workflows/build-docker-image.yml`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/.github/workflows/build-docker-image.yml#L27-L140) (lines 27, 56, 76, 113, 116, 122, 140)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** medium • **Slug:** `other-ci-secret-exposure`

## Owners

**Suggested assignee:** `v.rodionov@protonmail.com` _(via last-committer)_

## Finding

The reusable/manual Docker build workflow accepts an optional commit_sha input and checks out that ref before logging into the private registry and building the Docker context. The build step also passes SENTRY_AUTH_TOKEN as a Docker build argument. Any workflow caller or manual dispatcher able to point this at an unreviewed same-repository ref can run attacker-controlled Dockerfile/build logic with access to publishing credentials or the Sentry token, and can push a poisoned image under the trusted registry/tag flow.

## Recommendation

Do not pass secrets to builds of caller-selected or PR-controlled refs. Restrict commit_sha to reviewed/trusted refs, require protected environments for secret-bearing builds, and avoid Docker build args for secrets; use BuildKit secret mounts only in trusted release builds.

## Revalidation

**Verdict:** true-positive

The workflow exposes a string commit_sha input for both workflow_dispatch and workflow_call, and actions/checkout uses that value directly as ref in both the image-check and image-build jobs. There is no validation that the ref is a protected branch, reviewed commit, tag, or otherwise trusted object. After checkout, the workflow authenticates to the private registry using secrets.GCR_JSON_KEY and, in the build job, passes secrets.SENTRY_AUTH_TOKEN as a Docker build argument. A same-repository PR path exists through preview-deploy.yml, which calls this reusable workflow with secrets: inherit and commit_sha set to the PR head SHA for same-repository PRs. A malicious same-repository branch author could modify the Dockerfile or build scripts to read the SENTRY_AUTH_TOKEN build arg during docker build, or use the authenticated build/push flow to publish attacker-controlled image content under the trusted registry naming scheme. Forked PRs are blocked in preview-deploy.yml, but that does not mitigate same-repository branch abuse or manual dispatch by users who can choose unreviewed refs. The current HEAD is 1b29a961c0c756c6e7064def7dac3b63f03915df and the workflow still contains the vulnerable ref selection and secret-bearing build path.

## Recent committers (`git log`)

- SpontaneousOverthrow <v.rodionov@protonmail.com> (2026-07-03)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-30)
- James <74595920+catch-21@users.noreply.github.com> (2026-06-09)
- Taehwa Kim <hadeath03@gmail.com> (2026-05-22)
