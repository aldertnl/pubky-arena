# Local Code Review

Review code changes against project standards.

## Step 1 — Ask the user

Before doing anything, ask:

> **What do you want to review?**
>
> 1. Local uncommitted changes
> 2. Full branch diff against `dev`

Wait for the answer.

## Step 2 — Get the diff

- If **1**: run `git diff` and `git diff --staged`
- If **2**: run `git diff dev...HEAD`

## Step 3 — Load the rules

1. Read `.greptile/config.json` for the structured rule list with scopes and severities
2. Read `.greptile/rules.md` for detailed explanations and examples
3. For deeper context on any area, consult the relevant `docs/` file — see `docs/README.md` for the index
4. Check `docs/adr/` for Architecture Decision Records relevant to the changed areas

## Step 4 — Verify before reporting

Do NOT report anything as a violation unless you have confirmed it by reading the actual source code. For every potential issue:

- Read the file to confirm the violation exists — do not guess from the diff alone
- If a rule references a layer boundary (e.g., "controllers must not call services"), verify the import paths and call sites in the actual file
- If flagging an unused export, search the codebase to confirm it is truly unused
- If flagging dead code, verify the condition is actually always true/false

Never use words like "likely", "probably", or "appears to". Every reported violation must be confirmed.

## Step 5 — Report

For each confirmed violation:

- **File and line**
- **Rule ID** (from `.greptile/config.json`)
- **Severity** (high / medium / low)
- **What's wrong** — explain the specific violation
- **Why it matters** — reference the relevant doc (`docs/architecture.md`, `docs/error-handling.md`, etc.) and ADR if one exists (e.g., `docs/adr/0004-*.md`)
- **How to fix it**

Group by severity (high first). End with a summary table.

If no violations found, say so. Don't invent issues.
