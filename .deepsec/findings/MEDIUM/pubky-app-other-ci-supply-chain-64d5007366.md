# [MEDIUM] Format workflow uses mutable action tags

**File:** [`.github/workflows/format.yml`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/.github/workflows/format.yml#L22-L25) (lines 22, 25)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `other-ci-supply-chain`

## Owners

**Suggested assignee:** `74595920+catch-21@users.noreply.github.com` _(via last-committer)_

## Finding

actions/checkout and actions/setup-node are referenced only by major version tags. A retagged or compromised action release would execute in pull_request and push formatting/lint/typecheck runs with access to the checked-out repository and the workflow's GITHUB_TOKEN permissions.

## Recommendation

Pin GitHub Actions to full commit SHAs and set explicit minimal workflow permissions such as contents: read.

## Revalidation

**Verdict:** true-positive

I read the full 40-line workflow and confirmed it runs on merge_group, push to master/dev, pull_request, and workflow_dispatch. The job has no workflow-level or job-level permissions block, and the only external actions are actions/checkout@v4 and actions/setup-node@v4 at lines 22 and 25. Those are mutable major-version tags, not immutable commit SHAs, so the repository does not cryptographically pin the code that will execute in CI. A concrete attack exists if an upstream action repository, maintainer account, release process, or tag is compromised: malicious action code would run before the repository's npm ci, lint, and typecheck commands. That action code can read the checked-out repository and can use the workflow token subject to whatever default permissions the repository or organization grants; actions/checkout also receives the GitHub token by default. I checked recent history for the cited commits, and those changes only switched Node selection to .nvmrc and added a typecheck step, not action pinning or explicit permissions. There is no local mitigation in this workflow such as SHA pinning or contents: read permissions. The finding is therefore real, with the caveat that token-write impact depends on repository-level GitHub token defaults outside the file.

## Recent committers (`git log`)

- James <74595920+catch-21@users.noreply.github.com> (2026-05-19)
- V <jovanovicv90@gmail.com> (2026-04-23)
- jazkamer <v.rodionov@protonmail.com> (2026-03-18)
- Miguel Medeiros <miguel@miguelmedeiros.com.br> (2026-02-20)
