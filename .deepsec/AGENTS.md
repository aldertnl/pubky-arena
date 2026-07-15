# Agent setup

This is a deepsec scanning workspace. Keep the registered project context in
`data/<id>/INFO.md` aligned with the exact source snapshot being scanned.

## Common tasks

- **Refresh a project before scanning**: fetch the intended target branch,
  fast-forward the work branch, update `data/<id>/INFO.md` and
  `deepsec.config.ts` if the target commit changed, then remove generated
  `data/<id>/{files,runs,reports,project.json,tech.json}` from stale runs.
- **Set up a new project for scanning**: read `node_modules/deepsec/SKILL.md`,
  then fill `data/<id>/INFO.md` from the target codebase.
- **Add a new project**: run `deepsec init-project <root>` — it
  scaffolds `data/<id>/` and prints/writes the setup prompt for the
  new project.
- **Write a custom matcher** (only after a real true-positive shows you
  a pattern worth keeping): read
  `node_modules/deepsec/dist/docs/writing-matchers.md`.

## Reference

The deepsec skill is at `node_modules/deepsec/SKILL.md` (after
`pnpm install`). The full docs ship at
`node_modules/deepsec/dist/docs/`.
