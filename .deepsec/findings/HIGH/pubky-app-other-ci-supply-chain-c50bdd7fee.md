# [HIGH] Mutable external CI actions run with image-publishing credentials

**File:** [`.github/workflows/build-docker-image.yml`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/.github/workflows/build-docker-image.yml#L80-L140) (lines 80, 91, 94, 97, 116, 119, 122, 140)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `other-ci-supply-chain`

## Owners

**Suggested assignee:** `v.rodionov@protonmail.com` _(via last-committer)_

## Finding

Several actions from pubky/ci-workflows are referenced by the mutable main branch while the job supplies GCR_JSON_KEY and later SENTRY_AUTH_TOKEN. If that external repository branch or any referenced action implementation is compromised or force-moved, the workflow will execute attacker-controlled CI code with registry login material and image-push capability.

## Recommendation

Pin all external actions, including pubky/ci-workflows actions, to immutable full-length commit SHAs and update them through reviewed dependency bumps.

## Revalidation

**Verdict:** true-positive

The workflow uses pubky/ci-workflows actions from @main for get_head_commit_hash, registry_login, check_if_image_exists, and build_and_push. The registry_login action receives secrets.GCR_JSON_KEY, and the later build_and_push action runs after Docker registry authentication has been established. The build step also receives SENTRY_AUTH_TOKEN as a build argument, so a compromised mutable external action could access sensitive CI material or manipulate pushed images. Because @main is mutable, a force-push or compromise of the external pubky/ci-workflows repository would change code executed by this workflow without a reviewed dependency bump in pubky-app. The standard actions/checkout@v4 references are also mutable tags, but the most direct exposure here is the external pubky/ci-workflows @main chain that handles registry login and image publishing. No pinning or environment protection in this file mitigates that supply-chain path. This remains present in the current workflow.

## Recent committers (`git log`)

- SpontaneousOverthrow <v.rodionov@protonmail.com> (2026-07-03)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-30)
- James <74595920+catch-21@users.noreply.github.com> (2026-06-09)
- Taehwa Kim <hadeath03@gmail.com> (2026-05-22)
