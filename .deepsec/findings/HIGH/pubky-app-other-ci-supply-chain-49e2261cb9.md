# [HIGH] Secret-bearing E2E workflow depends on mutable action refs

**File:** [`.github/workflows/e2e-test.yml`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/.github/workflows/e2e-test.yml#L34-L298) (lines 34, 40, 47, 57, 60, 63, 71, 134, 140, 172, 175, 221, 237, 245, 272, 280, 289, 298)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `other-ci-supply-chain`

## Owners

**Suggested assignee:** `v.rodionov@protonmail.com` _(via last-committer)_

## Finding

The E2E workflow checks out private/submodule code with READ_REPOS and logs into the private registry with GCR_JSON_KEY, but the checkout, registry, build, Cypress, artifact, and log actions are pinned only to major tags or pubky/ci-workflows@main. A compromised or retagged action can run arbitrary code in jobs that have private-repo access, registry credentials, Docker login state, and artifact/log access.

## Recommendation

Pin every third-party and cross-repository action to a reviewed full commit SHA. Keep secret-bearing steps in the smallest possible jobs and avoid running later untrusted third-party actions in the same job after credentials have been materialized.

## Revalidation

**Verdict:** true-positive

The E2E workflow checks out pubky/pubky-stack with submodules using secrets.READ_REPOS, then uses multiple actions pinned only to mutable major tags or @main refs. In rebuild_images, pubky/ci-workflows actions from @main run around the GCR_JSON_KEY registry login and image rebuild flow. The e2e-test job again checks out private/submodule code with READ_REPOS, logs into the private registry with GCR_JSON_KEY, then runs later third-party actions such as cypress-io/github-action@v6, actions/upload-artifact@v4, and jwalton/gh-docker-logs@v2 in the same job context. A compromised or retagged action in this chain could read checked-out private code, use Docker registry authentication state, collect logs/artifacts, or interfere with images used by the test stack. The workflow only runs on workflow_dispatch and pushes to master/dev, not arbitrary PRs, but the risk described is supply-chain compromise of action refs in a secret-bearing workflow. There is no full-SHA pinning or isolation of secret-bearing steps in the current file. The finding is therefore real.

## Recent committers (`git log`)

- SpontaneousOverthrow <v.rodionov@protonmail.com> (2026-07-03)
- James <74595920+catch-21@users.noreply.github.com> (2026-03-20)
- Miguel Medeiros <miguel@miguelmedeiros.com.br> (2026-02-20)
