# [MEDIUM] Full Docker context copy can include gitignored secrets

**File:** [`Dockerfile`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/Dockerfile#L20) (lines 20)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `secrets-exposure`

## Owners

**Suggested assignee:** `v.rodionov@protonmail.com` _(via last-committer)_

## Finding

`COPY . .` copies the entire Docker build context into the builder stage. The traced `.dockerignore` only excludes `node_modules` and `.next`, while `.gitignore` shows local secret-bearing files such as `.env*`, `.env.sentry-build-plugin`, and `*.pem` are expected to exist outside git. Docker does not honor `.gitignore`, so local or remote builds can send and layer those files into the builder image/cache even though the final runner stage only copies selected build output.

## Recommendation

Add explicit `.dockerignore` exclusions for `.git`, `.env*`, `*.pem`, `.sentry-builder`, and other local artifacts, or replace the broad copy with an allowlist of required source files.

## Revalidation

**Verdict:** true-positive

The builder stage performs COPY . ., which copies the entire Docker build context into /app. The actual .dockerignore contains only node_modules and .next, so Docker will not exclude .env files, PEM files, .git, .sentry-builder, or other local artifacts unless they are absent from the context. The repo .gitignore does list .env*, .env.sentry-build-plugin, *.pem, and .sentry-builder, but Docker does not honor .gitignore. The traced workflow builds with context '.', so the broad context behavior is active in CI as well; GitHub checkout may not contain developer-local ignored secrets by default, but any generated or locally present ignored secret would be sent to the builder. Even though the final runner stage copies selected build output instead of the full tree, the secret-bearing files can still enter the builder layer, remote build cache, or build context transmission. This is enough for a real exposure risk in local, remote-builder, or cache-exported builds. No allowlist copy or matching .dockerignore exclusions currently mitigate it. The finding is accurately scoped as "can include" rather than guaranteed inclusion.

## Recent committers (`git log`)

- SpontaneousOverthrow <v.rodionov@protonmail.com> (2026-07-03)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-30)
- James <74595920+catch-21@users.noreply.github.com> (2026-06-09)
- tomos <55086152+86667@users.noreply.github.com> (2026-04-09)
