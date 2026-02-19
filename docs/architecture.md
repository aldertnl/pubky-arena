# Core Architecture (`src/core/`)

This document captures the intent, boundaries, responsibilities, and operating model of `src/core/`.
Based on ADR-0004, ADR-0008, ADR-0009.

## Layer Flow

```
UI (user actions) ──────┐
                        ↓
Coordinators (system) ─→ Controllers → Application → Services → Models
                         ↓              ↓             ↓
                         Stores         Pipes         Database
```

## Entry Points

Only these can initiate workflows:

| Entry Point      | Trigger                                  | Calls       |
| ---------------- | ---------------------------------------- | ----------- |
| **UI**           | User actions (clicks, forms)             | Controllers |
| **Coordinators** | System events (timers, auth, visibility) | Controllers |

## Layer Responsibilities

### Controllers (`src/core/controllers/`)

- Entry point for user-initiated actions
- Invoke pipes for normalization/validation
- Call application for business logic
- Mutate stores for UI state
- **NEVER** call services directly
- **NEVER** perform IO

### Coordinators (`src/core/coordinators/`)

- Entry point for system-initiated actions
- React to auth, visibility, route changes
- Call controllers (like UI does)
- **NEVER** call application directly
- **NEVER** call services directly

### Application (`src/core/*/application/`)

- Orchestrate business workflows
- Called BY controllers — **NOT an entry point**
- Call services for IO
- Can call other Applications (with restrictions — see below)
- **NEVER** access stores directly
- **NEVER** call controllers

### Services (`src/core/*/services/`)

- IO boundaries
- `local/` — Dexie persistence and cache integrity
- `homeserver/` — Network writes (PUT/POST/DELETE)
- `nexus/` — Network reads
- `homegate/` — Homegate API
- `chatwoot/` — Chatwoot integration
- `exchangerate/` — Exchange rate service
- **NEVER** call application or controllers
- **NEVER** access stores

### Pipes (`src/core/*/pipes/`)

- Normalize and validate data
- Transform external shapes to domain shapes via `pubky-app-specs`
- Pure functions only
- **NEVER** perform IO
- **NEVER** access database or network

### Models (`src/core/*/models/`)

- Dexie-based persistence only
- CRUD operations on IndexedDB
- **NEVER** perform network calls
- **NEVER** access stores

### Stores (`src/core/stores/`)

- Global UI state via Zustand
- No business logic

### Database (`src/core/database/`)

- Dexie schema versioning and safe initialization/recovery
- Migration logic

## Allowed Dependencies

```
UI → Controllers (user-initiated actions)
Coordinators → Controllers (system-initiated actions)
Controllers → Pipes, Application, Stores
Application → Services (local, homeserver, nexus)
Application → Application (cross-domain, acyclic only, max depth 1)
Services:
  local → Models
  homeserver → network only
  nexus → network only
Models → Dexie only (no network, no stores)
Pipes → no IO; transform only
```

**Key Rule:** Application is called BY controllers, never calls them back. Unidirectional flow.

## Application Cross-Domain Rules (ADR-0009)

Only these Applications can call other Applications:

- `PostApplication`
- `UserApplication`
- `NotificationApplication`

### Restrictions

```typescript
// ALLOWED: Orchestrators can call helper applications
PostApplication.createWithAttachments() {
  await FileApplication.upload(files);
  await TagApplication.commitCreate(tags);
}

// FORBIDDEN: Helper applications cannot call others
FileApplication.upload() {
  await TagApplication.create(); // VIOLATION
}

// FORBIDDEN: No circular dependencies
PostApplication → FileApplication → PostApplication  // VIOLATION

// FORBIDDEN: Max call depth is 1
PostApplication → FileApplication → ImageProcessor  // VIOLATION
```

Since the architecture uses static classes without dependency injection, these constraints **cannot be enforced at compile time**. They are enforced through code reviews and documentation. See ADR-0009.

## Anti-Patterns

### Controller calling Service directly

```typescript
// BAD
class PostController {
  static create() {
    await LocalPostService.upsert(post); // Bypass application
  }
}

// GOOD
class PostController {
  static create() {
    await PostApplication.create(post); // Through application
  }
}
```

### Application accessing Store

```typescript
// BAD
class PostApplication {
  static create() {
    usePostStore.getState().setLoading(true); // VIOLATION
  }
}

// GOOD — Controller handles store
class PostController {
  static create() {
    usePostStore.getState().setLoading(true);
    await PostApplication.create(post);
  }
}
```

### IO in Pipes

```typescript
// BAD
class PostPipe {
  static normalize(post) {
    const user = await LocalUserService.get(post.author); // IO!
  }
}

// GOOD
class PostPipe {
  static normalize(post) {
    return { ...post, id: `${post.author}:${post.postId}` }; // Pure
  }
}
```

### Coordinator calling Application directly

```typescript
// BAD
class NotificationCoordinator {
  static poll() {
    await NotificationApplication.fetch(); // Bypass controller
  }
}

// GOOD
class NotificationCoordinator {
  static poll() {
    await UserController.notifications(); // Through controller
  }
}
```

## IO Boundaries

### Inbound (entry points)

- **Controllers** (called by UI): Accept user intent, validate via pipes, invoke application, update stores.
- **Coordinators** (called by system): React to system events, call controllers.

### Outbound (to the outside world)

- `services/homeserver`: Session/auth, HTTP writes, blob uploads, auth URL creation, signup tokens.
- `services/nexus`: HTTP reads for bootstrap, streams, users, posts, tags, search, files. Pagination and stop semantics.
- `services/local`: Exclusive interface to Dexie models. Multi-table consistency, stream cache integrity, local-first writes with eventual consistency.

## File Organization

```
src/core/
├── controllers/           # Entry points for UI
├── coordinators/          # Entry points for system
├── [domain]/
│   ├── application/       # Business logic orchestration
│   ├── services/
│   │   ├── local/         # Dexie operations
│   │   ├── homeserver/    # Network writes
│   │   └── nexus/         # Network reads
│   ├── pipes/             # Data transformation
│   └── models/            # Dexie tables
├── stores/                # UI state (Zustand)
├── database/              # Dexie schema and migrations
├── utils/                 # Utility functions
└── index.ts               # Public API
```

## Architecture Decision Records

ADRs capture the _why_ behind key architectural decisions. Stored in `docs/adr/`.

| ADR  | Title                                  |
| ---- | -------------------------------------- |
| 0001 | Local-first writes                     |
| 0002 | Composite post IDs                     |
| 0003 | Streams as caches                      |
| 0004 | Layering and dependency rules          |
| 0005 | TTL refresh policy                     |
| 0006 | Pipes normalization                    |
| 0007 | Dexie version normalization            |
| 0008 | Coordinators layer                     |
| 0009 | Application cross-domain orchestration |
| 0010 | Notification application orchestration |
| 0011 | Dexie PSD and TanStack Query           |
| 0012 | TTL coordinator                        |
| 0013 | Post stream queue                      |
| 0014 | Muting system                          |
| 0015 | Error handling                         |
| 0016 | Service worker local file cache        |

## Quick Checklist

When adding/modifying code in `src/core/`:

- [ ] Does it respect layer boundaries?
- [ ] Is Application called BY controller, not calling controller?
- [ ] Are Coordinators going through Controllers?
- [ ] Is IO only in Services?
- [ ] Are Pipes pure (no IO)?
- [ ] Does cross-domain call follow ADR-0009 rules?
