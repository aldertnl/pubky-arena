# pubky-app

Scan target: latest fetched `origin/dev` at
`1b29a961c0c756c6e7064def7dac3b63f03915df` (`fix(ui): improve collection
description legibility (#2193)`). This context was refreshed after
fast-forwarding the work branch to that commit; do not mix findings from older
local `dev` snapshots.

## What this codebase does

Pubky App is a decentralized social web/PWA built with Next.js, React, Dexie,
Zustand, Tailwind, Shadcn UI, Serwist, `@synonymdev/pubky`, and
`pubky-app-specs`. Users sign in with Pubky cryptographic identities, read
indexed public data from Nexus, write their own `/pub/pubky.app/*` records to a
homeserver, and cache social data locally in IndexedDB for local-first UX.
Current `dev` also has public explore/collections routes, runtime-injected
`PUBKY_RUNTIME_*` config, optional Sentry observability, client-side image
metadata stripping/compression before uploads, and collection posts whose
content is a JSON envelope.

## Auth shape

- `AuthController` is the UI/system auth entry point; it owns store cleanup,
  auth-flow cancellation, and persisted-session restore orchestration.
- `AuthApplication` delegates sign-in, signup, logout, auth URL generation, and
  `userIsSignedUp` checks to `HomeserverService`.
- `HomeserverService.generateAuthUrl` uses Pubky auth capabilities
  `/pub/pubky.app/:rw`; `generateSignupAuthUrl` rewrites the auth URL for signup
  and embeds homeserver/invite-code metadata.
- `useAuthStore` persists `currentUserPubky`, `sessionExport`, and `hasProfile`;
  `useOnboardingStore` persists onboarding `secretKey`, `mnemonic`, and
  `inviteCode` until cleanup.
- `AuthController.cleanupLocalState` is the canonical logout/failed-restore
  cleanup path for stores, cookies, query clients, Dexie, coordinators, and
  in-memory queues.

## Threat model

Highest-impact failures are anything that lets one Pubky identity write or
delete another user's homeserver data, leak/reuse private key material,
recovery phrases, or `sessionExport`, or bypass the production-only block on
homeserver admin signup-token generation. Next priority is server-side request
abuse through OG metadata, Chatwoot/support routes, Homegate, Nexus, or
homeserver URL construction. Local cache corruption matters when it can cross
users on a shared device or make the UI perform writes for the wrong identity.
Also flag runtime-config injection bugs that make a production deploy silently
fall back to staging infrastructure, inline-script escaping/CSP weaknesses,
Sentry events that include secrets or raw recovery material, and upload paths
that allow GPS/EXIF/SVG active content or oversized images to reach homeserver.

## Project-specific patterns to flag

- Homeserver writes/deletes/uploads must target the current session's owned
  `/pub/*` path via `resolveOwnedSessionPath`; non-owned `pubky://` writes should
  be rejected, not sent through public storage.
- Controller method names encode IO guarantees: `fetch*` is network only,
  `get*` is local only, `getOrFetch*` is local-first, and `commit*` performs
  writes. Watch for code that violates those semantics or bypasses Controllers.
- Layer boundaries are security boundaries: Controllers call Application,
  Coordinators call Controllers, Application calls Services, and Pipes stay pure.
  Direct Controller-to-Service or Pipe IO can skip validation/store cleanup.
- Composite post/file IDs are `author:postId`; parsing/building must use
  `buildCompositeId`, `parseCompositeId`, or `buildCompositeIdFromPubkyUri`.
  Hand-rolled splitting can mis-handle Pubky URI/path forms.
- File uploads are two-part writes: blob bytes plus metadata. `FileNormalizer`
  creates both via `pubky-app-specs`, and `FileApplication.commitDelete` should
  remove metadata and blob consistently.
- Public/explore routes (`/home`, `/hot`, `/search`, `/collections`, public
  posts/profiles/collections, invite links) may be unauthenticated by design.
  Mutations, saves, replies, tags, bookmarks, settings, and account deletion
  must still require a restored current session.
- Runtime config must be read through `@/libs/runtime-config/runtime-config`
  lazy getters or concrete `src/config/*` wrappers. Do not read
  `process.env.PUBKY_RUNTIME_*` directly. The raw inline
  `window.__PUBKY_CONFIG__` script must keep `escapeForInlineScript` protection.
- Collection posts use `kind === "collection"` and JSON `content`; callers
  should parse with collection helpers instead of treating raw JSON as display
  text or copyable post body.
- Image upload sanitization lives in `src/libs/image/stripImageMetadata.ts` and
  `imageUploadSizeLimit.ts`; SVG handling should remove active content/risky
  references and oversized inputs should fail closed.
- Sentry capture is centralized in `src/libs/observability/*`; new contexts
  should be scrubbed and should not include keypairs, mnemonic/recovery phrases,
  session exports, tokens, support credentials, or uploaded file bytes.

## Known false-positives

- `src/app/api/dev/signup-token/route.ts` is intentionally present for local/E2E
  token generation, but it must stay blocked when `NODE_ENV=production` unless
  `CYPRESS=true`; admin env vars are server-side only.
- `src/app/api/feedback`, `src/app/api/report`, and `src/app/api/copyright` are
  intended public POST routes. They delegate validation to Controllers/Pipes and
  use server-side Chatwoot credentials.
- `src/app/api/og-metadata/route.ts` intentionally fetches user-supplied URLs.
  The expected SSRF defenses are `OgMetadataValidators`, `validateDns`,
  `isIpSafe`, manual redirect validation, and a 5MB response-body cap.
- Nexus reads are public/cacheable social data fetched through `queryNexus`;
  unauthenticated Nexus reads are normal, but writes should go through
  homeserver/session primitives.
- Serwist only runtime-caches Nexus API responses and share-target files; it
  intentionally avoids caching pkarr, homeserver, and httprelay traffic.
- `/api/sentry-test` and `/sentry-test` are intentional diagnostics, gated by
  runtime Sentry environment and unavailable in production.
- The runtime config inline script intentionally uses
  `dangerouslySetInnerHTML` after JSON escaping; this is not arbitrary user HTML.
