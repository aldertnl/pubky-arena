# [MEDIUM] Test workflow executes mutable actions and an unpinned npx package

**File:** [`.github/workflows/test.yml`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/.github/workflows/test.yml#L31-L87) (lines 31, 34, 39, 59, 76, 84, 87)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `other-ci-supply-chain`

## Owners

**Suggested assignee:** `74595920+catch-21@users.noreply.github.com` _(via last-committer)_

## Finding

The test workflow has no secrets, so this is lower impact than the release workflow, but it still executes external code from mutable refs: actions/checkout@v4, actions/setup-node@v4, oven-sh/setup-bun@v2, actions/upload-artifact@v4, and actions/download-artifact@v4. The merge job also runs 'npx nyc report' without installing dependencies in that job, and neither package.json nor package-lock.json contains nyc, so GitHub-hosted CI may fetch and execute the current npm nyc package outside the repository lockfile. A compromised action ref or npm package could tamper with CI results/artifacts and access whatever default GITHUB_TOKEN permissions the repository grants, because this workflow does not explicitly set permissions.

## Recommendation

Pin actions to immutable full commit SHAs. Add explicit workflow or job permissions, normally contents: read for this workflow. Add nyc as a pinned devDependency and install from the lockfile in the merge job, or run a locked local binary with npx --no-install/corepack-equivalent behavior.

## Revalidation

**Verdict:** true-positive

I read the full 107-line workflow and confirmed the flagged external actions are present: actions/checkout@v4, actions/setup-node@v4, oven-sh/setup-bun@v2, actions/upload-artifact@v4, and actions/download-artifact@v4. None are pinned to commit SHAs, and this workflow also has no explicit permissions block, so malicious action code would run with the workflow token permissions GitHub grants by default. The shard job installs dependencies with bun install before npx vitest, and vitest is a declared devDependency, so that particular npx call is covered by the repository dependency set. The merge-coverage job is different: it checks out the repo, downloads artifacts, and then runs npx nyc report without installing dependencies first. I checked package.json and package-lock.json for nyc, node_modules/nyc, and @istanbuljs/nyc-config entries and found no declared or locked nyc package. A concrete attack exists if the nyc npm package or the npx resolution path is compromised, because the merge job may fetch and execute package code outside the repository lockfile; another concrete attack exists through any compromised mutable action tag. The workflow has no secrets configured, which limits impact, but compromised CI code could still tamper with coverage artifacts/results and access the checked-out source and available GITHUB_TOKEN permissions. Recent workflow history did not pin the actions, add permissions, or add nyc as a locked dependency, so the issue is not fixed.

## Recent committers (`git log`)

- James <74595920+catch-21@users.noreply.github.com> (2026-05-19)
- SpontaneousOverthrow <v.rodionov@protonmail.com> (2026-03-30)
