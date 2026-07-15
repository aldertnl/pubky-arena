# [MEDIUM] Build workflow uses mutable action tags

**File:** [`.github/workflows/build.yml`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/.github/workflows/build.yml#L22-L25) (lines 22, 25)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `other-ci-supply-chain`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

actions/checkout and actions/setup-node are referenced only by major version tags. A retagged or compromised action release would execute in every build, including pull_request and push runs, with access to the repository checkout and the workflow's GITHUB_TOKEN permissions.

## Recommendation

Pin GitHub Actions to full commit SHAs and set explicit minimal workflow permissions such as contents: read.

## Revalidation

**Verdict:** true-positive

The build workflow uses actions/checkout@v4 and actions/setup-node@v4, both mutable major-version tags rather than immutable full commit SHAs. The workflow runs for pull_request, push to master/dev, merge_group, and manual dispatch. A compromised or retagged action could execute arbitrary code during those runs with access to the repository checkout, npm cache material, and whatever GITHUB_TOKEN permissions the repository grants to the workflow. The file does not define an explicit permissions block, so token scope depends on repository or organization defaults rather than being minimized in the workflow. There are no application secrets passed in this workflow, which keeps the impact lower than the Docker and deployment workflows. Still, the supply-chain issue described is present in the current file and is exploitable under the standard mutable-action compromise scenario.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-30)
- James <74595920+catch-21@users.noreply.github.com> (2026-05-19)
- jazkamer <v.rodionov@protonmail.com> (2026-03-18)
- Miguel Medeiros <miguel@miguelmedeiros.com.br> (2026-02-20)
