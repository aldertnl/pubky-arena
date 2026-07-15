# [MEDIUM] Preview proxy sidecar uses a mutable latest image tag

**File:** [`preview-deploy-service-file.yml`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/preview-deploy-service-file.yml#L28-L30) (lines 28, 30)
**Project:** pubky-app
**Severity:** MEDIUM • **Confidence:** high • **Slug:** `other-supply-chain-integrity`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

The preview Cloud Run service runs the `nginx` sidecar from `nginx-normilizer:latest`. This sidecar owns the exposed port and sits in front of the app container, so a registry compromise or accidental retag can change the component handling preview traffic without any source change. The hardcoded runtime env values are public config, and the Sentry DSN is public by design; the real issue is the mutable executable image reference.

## Recommendation

Pin the sidecar image to an immutable digest or a versioned, non-reused tag, and promote updates through review.

## Revalidation

**Verdict:** true-positive

The preview Cloud Run service defines an nginx sidecar image as europe-west6-docker.pkg.dev/infra-464608/synonym-private-repo/nginx-normilizer:latest. The preview deployment workflow only rewrites containers[1].image, which is the pubky-app container, leaving the sidecar reference unchanged. That sidecar exposes containerPort 8080 and the Cloud Run container dependency annotation puts nginx in front of the app container, so it handles preview traffic. Because latest is mutable, a retag or registry compromise can change the proxy code used by previews without any source-code change or review. The hardcoded runtime config and public Sentry DSN are not the issue; the executable image reference is. There is no digest pin or reviewed version tag in the service file. The finding remains present at the current commit. This is a valid supply-chain integrity issue.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-30)
- SpontaneousOverthrow <v.rodionov@protonmail.com> (2026-06-01)
