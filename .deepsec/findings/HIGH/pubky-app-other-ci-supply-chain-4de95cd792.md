# [HIGH] Mutable release actions can exfiltrate Docker Hub credentials or publish a backdoored image

**File:** [`.github/workflows/release-docker.yml`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/.github/workflows/release-docker.yml#L17-L30) (lines 17, 20, 22, 23, 26, 30)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `other-ci-supply-chain`

## Owners

**Suggested assignee:** `v.rodionov@protonmail.com` _(via last-committer)_

## Finding

The release workflow runs on version tags and logs in to Docker Hub with DOCKERHUB_USERNAME and DOCKERHUB_TOKEN, then builds and pushes the public image. All executable actions are referenced by mutable tags or branches: actions/checkout@v4, docker/login-action@v3, and especially pubky/ci-workflows/.github/actions/docker/build_and_push@main. If any referenced action tag/branch is compromised or force-moved, attacker-controlled code runs in the release job. The login action directly receives the Docker Hub token, and the later build action runs after Docker credentials have been written on the runner, so compromise can steal credentials and/or publish a malicious pubky-app image under the official repository.

## Recommendation

Pin all third-party and cross-repository actions to immutable full commit SHAs. Avoid using @main for release-critical composite actions; consume a reviewed immutable ref instead. Keep the Docker Hub token scoped to only the required repository, and consider a protected GitHub Environment with required reviewers for release publishing.

## Revalidation

**Verdict:** true-positive

The release workflow runs on v\* tag pushes and logs into Docker Hub with secrets.DOCKERHUB_USERNAME and secrets.DOCKERHUB_TOKEN. docker/login-action@v3 is a mutable major tag and directly receives the Docker Hub token. The later pubky/ci-workflows build_and_push action is referenced from @main and runs after Docker credentials have been written on the runner. If either mutable action ref is compromised or moved, attacker-controlled code can steal Docker Hub credentials, alter build behavior, or push a malicious synonymsoft/pubky-app image. actions/checkout@v4 is also unpinned, though it is less directly tied to the Docker Hub token than the login and build actions. The workflow sets contents: read for GITHUB_TOKEN, but that does not constrain Docker Hub secrets or the authenticated Docker client state. No immutable SHA pinning or protected release environment is present in this file.

## Recent committers (`git log`)

- SpontaneousOverthrow <v.rodionov@protonmail.com> (2026-07-03)
