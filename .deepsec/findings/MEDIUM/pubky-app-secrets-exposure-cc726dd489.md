# [MEDIUM] Docker build context can include checkout credentials and unignored local files

**File:** [`.github/workflows/release-docker.yml`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/.github/workflows/release-docker.yml#L17-L39) (lines 17, 29, 39)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `secrets-exposure`

## Owners

**Suggested assignee:** `v.rodionov@protonmail.com` _(via last-committer)_

## Finding

The workflow checks out the repository with the default actions/checkout behavior, which persists the GitHub token in the local git config until post-job cleanup. It then builds with context '.'. The repository .dockerignore only excludes node_modules and .next, while the Dockerfile copies the full context into the builder stage. That means .git, including checkout credential configuration during CI, and any other unignored workspace files are sent into the Docker build context. Because cache_to uses type=gha,mode=max, intermediate layers containing that context can also be exported to the GitHub Actions cache. The configured workflow token is contents:read, reducing impact, but this still exposes a live credential and any accidental unignored secrets to build-time code and cache material.

## Recommendation

Set actions/checkout with persist-credentials: false for Docker builds that do not need git push/fetch credentials. Add .git, .github, .env\*, local IDE/agent directories, coverage, logs, and other non-runtime files to .dockerignore. Prefer narrowly copied source paths in the Dockerfile instead of COPY . . where practical.

## Revalidation

**Verdict:** true-positive

The release workflow uses actions/checkout@v4 without persist-credentials: false, so the default checkout behavior persists a GitHub token in local git configuration until post-job cleanup. The Docker build input sets context: ., and the repository .dockerignore contains only node_modules and .next. The Dockerfile then performs COPY . . in the builder stage, so .git, .github, .env.example, and any other unignored workspace files are eligible to enter the build context and builder filesystem. With checkout credentials persisted, build-time code can read the copied .git/config and access the workflow token while it is still live, although the workflow limits that token to contents: read. The release workflow also passes cache_to: type=gha,mode=max to the external build action, so intermediate builder layers containing the copied context may be exported to GitHub Actions cache if the action honors that input as intended. The final runner image does not directly copy the whole builder filesystem, which reduces exposure in the published image, but it does not remove the build-time and cache exposure. The finding is therefore real, with impact reduced by the read-only workflow token and by the absence of checked-in secret files beyond the checkout credential risk.

## Recent committers (`git log`)

- SpontaneousOverthrow <v.rodionov@protonmail.com> (2026-07-03)
