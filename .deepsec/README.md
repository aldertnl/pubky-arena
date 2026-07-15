# deepsec

This directory holds the [deepsec](https://www.npmjs.com/package/deepsec)
config for the parent repo. Checked into git so teammates inherit
project context (auth shape, threat model, custom matchers); generated
runtime state is gitignored. Exported findings for the latest reviewed scan are
checked in under `findings/` and `findings.json`.

Configured project: `pubky-app` (target: `..`).

Current scan target: latest fetched `origin/dev` at
`1b29a961c0c756c6e7064def7dac3b63f03915df` (`fix(ui): improve collection
description legibility (#2193)`). Before running a new scan, fetch `origin/dev`
and fast-forward this branch; if the SHA changes, update
`deepsec.config.ts` and `data/pubky-app/INFO.md` so source links and findings
match the scanned snapshot.

Latest scan summary:

- Agent/model: `codex` / `gpt-5.5`
- Result: 97 raw findings, 96 true positives, 1 false positive
- Cost: `$227.37` total (`$188.64` process + `$38.73` revalidate)
- Write-up and follow-up issues: `RESULTS.md`

## Setup

1. `pnpm install` — installs deepsec.
2. Add an AI Gateway / Anthropic / OpenAI token to `.env.local`. If
   you already have `claude` or `codex` CLI logged in on this
   machine, you can skip the token for non-sandbox runs (`process` /
   `revalidate` / `triage`); deepsec auto-detects and reuses the
   subscription. See
   `node_modules/deepsec/dist/docs/vercel-setup.md` after install.
3. Keep `data/pubky-app/INFO.md` aligned with the current target commit before
   launching a fresh full-repo scan.

## Daily commands

```bash
pnpm deepsec scan
pnpm deepsec process     --agent codex
pnpm deepsec revalidate  --agent codex                    # cuts FP rate
pnpm deepsec export      --format md-dir --out ./findings
pnpm deepsec export      --format json --out ./findings.json
```

`--project-id` is auto-resolved while there's only one project in
`deepsec.config.ts`. Once you've added a second project, pass
`--project-id pubky-app` (or whichever id you want) explicitly.

`scan` is free (regex only). `process` and `revalidate` are the AI stages.
This workspace defaults to the Codex agent in `deepsec.config.ts`; local Codex
CLI subscription auth can be reused, so no API key is required for this machine
when `codex doctor` reports a signed-in ChatGPT session. Run state goes to
`data/pubky-app/`.

Before committing exported findings, verify that report links use the scanned
target SHA from `deepsec.config.ts` rather than a temporary work-branch URL.

## Adding another project

To scan another codebase from this same `.deepsec/`:

```bash
pnpm deepsec init-project ../some-other-package   # path relative to .deepsec/
```

Appends an entry to `deepsec.config.ts` and writes project metadata under
`data/<id>/`. Use the generated setup prompt if you are initializing a
different future project; this `pubky-app` setup is already complete and keeps
only hand-curated `INFO.md` plus exported findings in git.

## Layout

```
deepsec.config.ts        Project list (one entry per scanned repo)
RESULTS.md               Latest scan target, costs, run ids, and issue links
findings/                Exported true-positive markdown findings
findings.json            Exported true-positive JSON findings
data/pubky-app/
  INFO.md                Repo context — checked into git, hand-curated
  project.json           Generated (gitignored)
  tech.json              Generated technology detection (gitignored)
  files/                 One JSON per scanned source file (gitignored)
  runs/                  Run metadata (gitignored)
  reports/               Generated markdown reports (gitignored)
AGENTS.md                Pointer for coding agents
.env.local               Tokens (gitignored)
```

## Docs

After `pnpm install`:

- Skill: `node_modules/deepsec/SKILL.md`
- Full docs: `node_modules/deepsec/dist/docs/{getting-started,configuration,models,writing-matchers,plugins,architecture,data-layout,vercel-setup,faq}.md`

Or browse on
[GitHub](https://github.com/vercel-labs/deepsec/tree/main/docs).
