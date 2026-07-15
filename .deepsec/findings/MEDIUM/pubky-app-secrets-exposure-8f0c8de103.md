# [MEDIUM] Sentry auth token is passed as a Docker build argument

**File:** [`Dockerfile`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/Dockerfile#L56-L60) (lines 56, 59, 60)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** medium • **Slug:** `secrets-exposure`

## Owners

**Suggested assignee:** `v.rodionov@protonmail.com` _(via last-committer)_

## Finding

The Dockerfile declares `ARG SENTRY_AUTH_TOKEN` and consumes it during a `RUN` step for source-map upload. The traced CI workflow passes `secrets.SENTRY_AUTH_TOKEN` through Docker build args. Build args are not a secret mechanism; they can be exposed through build metadata, provenance, cache exporters, or other build steps even if they are not persisted as final image environment variables.

## Recommendation

Use BuildKit secret mounts for the Sentry token, or perform source-map upload as a separate CI step outside the Docker build.

## Revalidation

**Verdict:** true-positive

The Dockerfile declares ARG SENTRY_AUTH_TOKEN, ARG SENTRY_ORG, and ARG SENTRY_PROJECT, then uses SENTRY_AUTH_TOKEN inside a RUN step that uploads source maps. The traced GitHub workflow passes SENTRY_AUTH_TOKEN=${{ secrets.SENTRY_AUTH_TOKEN }} through the build_args input. Docker build args are not a secret transport mechanism; they can be exposed through build metadata, provenance, cache exporters, builder diagnostics, or other steps depending on the build implementation. The token is not set as a final ENV in the runner image, but that does not address exposure during the build. There is no BuildKit --secret mount or separate post-build source-map upload path in the current Dockerfile. A concrete attacker model is someone with access to shared build cache/provenance/metadata or a compromised build action obtaining the arg value. The current commit still contains this build-arg path. The finding is therefore real despite the token not being intentionally shipped in the final image environment.

## Recent committers (`git log`)

- SpontaneousOverthrow <v.rodionov@protonmail.com> (2026-07-03)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-30)
- James <74595920+catch-21@users.noreply.github.com> (2026-06-09)
- tomos <55086152+86667@users.noreply.github.com> (2026-04-09)
