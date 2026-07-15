# Deepsec scan results

Scan target: latest fetched `origin/dev` at
`1b29a961c0c756c6e7064def7dac3b63f03915df` (`fix(ui): improve collection
description legibility (#2193)`).

Parent task: https://github.com/pubky/pubky-app/issues/2187

## Backend

- Agent: `codex`
- Model: `gpt-5.5`
- Auth: local Codex ChatGPT subscription auth; no `AI_GATEWAY_API_KEY` or
  provider API key was needed on this machine.

## Commands

```bash
pnpm deepsec scan --project-id pubky-app
pnpm deepsec process --project-id pubky-app --agent codex
pnpm deepsec revalidate --project-id pubky-app --agent codex
pnpm deepsec export --project-id pubky-app --only-true-positive --format md-dir --out ./findings
pnpm deepsec export --project-id pubky-app --only-true-positive --format json --out ./findings.json
```

## Run IDs

- Scan: `20260715101212-9ad6a992eb3bf9c7`
- Process: `20260715101221-5228c4ee0c8f37d5`
- Revalidate: `20260715105059-3d8a4eabe9e75833`

## Results

- Files with candidates: 512
- Raw findings: 97
- Revalidated true positives: 96
- False positives: 1
- Revalidated findings by severity, including the false positive: 2 critical,
  21 high, 36 medium, 2 high-bug, 36 bug
- Exported true positives by severity: 2 critical, 21 high, 36 medium,
  2 high-bug, 35 bug
- Cost: `$188.64` process + `$38.73` revalidate = `$227.37`
- Tokens: 17.3M input, 1.5M output, 92% cache hit

Exports:

- Markdown directory: `.deepsec/findings/`
- JSON: `.deepsec/findings.json`

## False positive

- `[BUG] Embla reInit listener is not removed during Carousel cleanup`
  (`src/components/atoms/Carousel/Carousel.tsx`). Deepsec revalidation marked
  this false-positive because `embla-carousel-react` destroys the old Embla API
  on unmount/API replacement, and Embla's destroy lifecycle clears the event
  handler table, including the `reInit` listener.

## Follow-up issues

The 96 true-positive exports are grouped into these non-overlapping follow-up
issues:

| Issue                                          | True positives | Scope                                                        |
| ---------------------------------------------- | -------------: | ------------------------------------------------------------ |
| https://github.com/pubky/pubky-app/issues/2209 |              7 | OG metadata SSRF                                             |
| https://github.com/pubky/pubky-app/issues/2210 |              7 | Unsafe profile/external-link URL schemes                     |
| https://github.com/pubky/pubky-app/issues/2211 |             16 | Public support/metadata endpoint abuse and Chatwoot routing  |
| https://github.com/pubky/pubky-app/issues/2212 |             15 | CI/CD, Docker, and supply-chain secret handling              |
| https://github.com/pubky/pubky-app/issues/2213 |              7 | Recovery, onboarding, logging, and telemetry secrets         |
| https://github.com/pubky/pubky-app/issues/2214 |              8 | Failed remote writes/deletes and orphaned upload consistency |
| https://github.com/pubky/pubky-app/issues/2215 |              9 | User/session-scoped local caches and async writes            |
| https://github.com/pubky/pubky-app/issues/2216 |             16 | Stream/cache races and stale UI state                        |
| https://github.com/pubky/pubky-app/issues/2217 |              5 | Domain logic correctness                                     |
| https://github.com/pubky/pubky-app/issues/2218 |              6 | Attachment and media validation/rendering                    |
