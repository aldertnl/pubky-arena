# [HIGH] Same-repository PR preview builds inherit secrets for PR head code

**File:** [`.github/workflows/preview-deploy.yml`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/.github/workflows/preview-deploy.yml#L34-L71) (lines 34, 37, 66, 70, 71)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** medium • **Slug:** `other-ci-secret-exposure`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

The pull_request path intentionally blocks forked PRs, but same-repository PRs still call the Docker build workflow with secrets: inherit and commit_sha set to the PR head SHA. If same-repository branch authors are not fully trusted with CI secrets, they can modify build inputs such as the Dockerfile and run that code in the secret-bearing Docker build/push workflow.

## Recommendation

Treat preview builds of PR head code as untrusted unless every same-repository branch author is trusted with registry, Sentry, and deployment credentials. Use protected environments, maintainer approval, or a two-phase flow that builds PR code without secrets and only deploys reviewed artifacts.

## Revalidation

**Verdict:** true-positive

The set-vars job explicitly allows pull_request events only when github.event.pull_request.head.repo.full_name equals github.repository, which blocks forks but allows same-repository PR branches. The build-preview job then calls the reusable build-docker-image workflow with secrets: inherit and commit_sha set to github.event.pull_request.head.sha. In the called workflow, that commit is checked out and built, while registry credentials are used and SENTRY_AUTH_TOKEN is passed as a Docker build argument. A same-repository branch author who is allowed to open PRs but should not have CI secrets could modify the Dockerfile or build scripts to exfiltrate the Sentry token during build or to produce a malicious preview image. The fork restriction is a partial mitigation only for external contributors; it does not protect secrets from untrusted same-repository branch authors. The current workflow has no maintainer approval gate, protected environment, or separation between untrusted PR build code and secret-bearing publish/deploy steps. This is the same risk described by the finding.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-30)
- SpontaneousOverthrow <v.rodionov@protonmail.com> (2026-06-01)
