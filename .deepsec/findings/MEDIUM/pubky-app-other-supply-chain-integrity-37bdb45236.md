# [MEDIUM] Docker base image is not pinned by digest

**File:** [`Dockerfile`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/Dockerfile#L2-L72) (lines 2, 14, 72)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `other-supply-chain-integrity`

## Owners

**Suggested assignee:** `v.rodionov@protonmail.com` _(via last-committer)_

## Finding

All three stages use the mutable tag `node:lts-alpine` instead of an immutable `@sha256:` digest. A later rebuild can silently pull different Node/Alpine contents under the same tag; if the upstream tag or registry is compromised or retagged, attacker-controlled code could enter both the build and runtime image.

## Recommendation

Pin each base image to a reviewed digest, and update that digest through a controlled dependency-update process.

## Revalidation

**Verdict:** true-positive

The Dockerfile uses FROM node:lts-alpine in all three stages: deps, builder, and runner. None of those references include an immutable @sha256 digest. A rebuild therefore depends on whatever content the registry currently serves for the lts-alpine tag, not the reviewed base image content at the time of the commit. This affects both build-time execution, including npm install/build and Sentry commands, and the final runtime image. The current git state at the requested commit still has the mutable tag references, so this has not been patched. A realistic supply-chain scenario is an upstream retag, compromised registry, or unexpected Node/Alpine change being pulled into a release without a source diff. Docker tag mutability is not mitigated elsewhere in this file or the traced workflow. The finding is real as a supply-chain integrity issue.

## Recent committers (`git log`)

- SpontaneousOverthrow <v.rodionov@protonmail.com> (2026-07-03)
- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-30)
- James <74595920+catch-21@users.noreply.github.com> (2026-06-09)
- tomos <55086152+86667@users.noreply.github.com> (2026-04-09)
