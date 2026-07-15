# [HIGH] Manual cleanup input can reach an authenticated gcloud shell command

**File:** [`.github/workflows/preview-deploy.yml`](https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df/.github/workflows/preview-deploy.yml#L132-L155) (lines 132, 139, 143, 146, 155)
**Project:** pubky-app
**Severity:** HIGH • **Confidence:** high • **Slug:** `other-ci-command-injection`

## Owners

**Suggested assignee:** `orlando.goncalves@gmail.com` _(via last-committer)_

## Finding

The workflow_dispatch pr_number input is copied into service_name without numeric validation, and the cleanup step later interpolates that output directly into an unquoted shell command after authenticating to GCP. A user able to manually dispatch the workflow can preserve shell syntax such as command substitution through the output and have it evaluated in the Delete Cloud Run service step, gaining command execution in a cloud-authenticated job.

## Recommendation

Validate pr_number with a strict numeric allowlist before writing outputs, pass values to shell through env variables, and quote shell expansions, for example: gcloud run services delete "$SERVICE_NAME" --region="$REGION" --quiet.

## Revalidation

**Verdict:** true-positive

workflow_dispatch accepts pr_number as an unconstrained string and the cleanup job copies it into PR_NUMBER without numeric validation. The value is then written to GITHUB_OUTPUT as service_name=pubky-app-pr-${PR_NUMBER}. After google-github-actions/auth and setup-gcloud run, the Delete Cloud Run service step interpolates steps.vars.outputs.service_name directly into an unquoted shell command. An attacker able to manually dispatch the cleanup action can preserve shell syntax through the first step, for example by supplying an escaped command substitution that becomes a literal $(...) in the step output and is then evaluated in the later gcloud run services delete command. The pull_request_target closed path uses GitHub's pull request number and is effectively numeric, but the manual cleanup path has no such mitigation. Quoting is also absent around both the service name and region expansion in the final shell command. This provides command execution in a GCP-authenticated job, so the finding is exploitable as written.

## Recent committers (`git log`)

- Orlando Goncalves <orlando.goncalves@gmail.com> (2026-06-30)
- SpontaneousOverthrow <v.rodionov@protonmail.com> (2026-06-01)
