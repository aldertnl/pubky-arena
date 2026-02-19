# Local-First Patterns

Rules for implementing local-first patterns. Based on ADR-0001, ADR-0011.

## Consistency Model

The write model is local-first, ensuring immediate responsiveness for the user.

- UI reflects local state immediately; eventual consistency with the homeserver and nexus.
- Reconciliation occurs via periodic retries or explicit repair flows.
- Rollback (compensation) is optional and applied only when strict consistency is required.

## Write Flow

All write operations must follow this pattern:

```
1. Write to IndexedDB (Dexie) first
2. Update UI immediately
3. Sync to homeserver in background
4. Reconcile conflicts asynchronously
```

## Controller Method Naming

Controller method names encode IO behavior and delivery guarantees:

### Read Operations

| Prefix            | Source            | Network | Description                         |
| ----------------- | ----------------- | ------- | ----------------------------------- |
| `fetch*`          | Nexus API         | Yes     | Network only, no cache              |
| `get*`            | IndexedDB         | No      | Local cache only                    |
| `getMany*`        | IndexedDB         | No      | Bulk reads, returns `Map<Pubky, T>` |
| `getOrFetch*`     | IndexedDB → Nexus | Maybe   | Local first, fallback to network    |
| `getManyOrFetch*` | IndexedDB → Nexus | Maybe   | Bulk local first, fetch missing     |

### Write Operations

| Prefix                            | Pattern     | Description                            |
| --------------------------------- | ----------- | -------------------------------------- |
| `commit[Create\|Update\|Delete]*` | Local-first | Write to IndexedDB, sync to homeserver |

## Examples

### Read Methods

```typescript
// Good naming
PostController.fetchPost(id); // Always network
PostController.getPost(id); // Always local
PostController.getOrFetchPost(id); // Local first, fallback
UserController.getManyProfiles(pubkys); // Bulk local
UserController.getManyOrFetchProfiles(pubkys); // Bulk with fallback

// Bad naming
PostController.loadPost(id); // Unclear source
PostController.retrievePost(id); // Unclear source
```

### Write Methods

```typescript
// Good naming
PostController.commitCreatePost(post);
PostController.commitUpdatePost(id, data);
PostController.commitDeletePost(id);
BookmarkController.commitCreateBookmark(postId);

// Bad naming
PostController.createPost(post); // Missing "commit" prefix
PostController.savePost(post); // Unclear operation type
PostController.removePost(id); // Should be commitDelete
```

## Implementation Pattern

### Write Operation Flow

```typescript
class PostController {
  static async commitCreatePost(input: CreatePostInput) {
    // 1. Validate/normalize via pipes
    const post = PostPipe.normalizeCreate(input);

    // 2. Update UI state immediately
    usePostStore.getState().addOptimistic(post);

    // 3. Persist locally first (through application)
    await PostApplication.create(post);

    // 4. Background sync happens in application layer
  }
}

class PostApplication {
  static async create(post: Post) {
    await LocalPostService.upsert(post);

    try {
      await HomeserverService.put(post);
    } catch (error) {
      // Queue for retry, don't block UI
    }
  }
}
```

## useLiveQuery Rules (ADR-0011)

When using Dexie's `useLiveQuery`:

### DO

```typescript
// Pure, read-only, local-only
const posts = useLiveQuery(() => LocalPostService.getByStream(streamId), [streamId]);
```

### DON'T

```typescript
// Never call TanStack Query or network code inside useLiveQuery
const posts = useLiveQuery(async () => {
  const local = await LocalPostService.get(id);
  if (!local) {
    await queryClient.fetchQuery(...); // Breaks Dexie PSD
  }
  return local;
}, [id]);
```

### Pattern: Fetch in useEffect, Read in useLiveQuery

```typescript
function PostView({ id }) {
  useEffect(() => {
    PostController.getOrFetchPost(id);
  }, [id]);

  const post = useLiveQuery(
    () => LocalPostService.get(id),
    [id]
  );

  return <PostCard post={post} />;
}
```

## Persistence Order

When writing related entities, persist dependencies first:

```typescript
// Correct order
await LocalUserService.upsert(author); // 1. Author first
await LocalPostService.upsert(post); // 2. Then post
await LocalTagService.upsert(tags); // 3. Then tags

// Wrong order (foreign key issues)
await LocalPostService.upsert(post); // Post references author
await LocalUserService.upsert(author); // Author not yet in DB!
```

## Optimistic Updates

For immediate UI feedback:

```typescript
// 1. Optimistic update in store
usePostStore.getState().addPost(optimisticPost);

// 2. Persist
try {
  await PostApplication.create(post);
} catch (error) {
  // Rollback on failure
  usePostStore.getState().removePost(optimisticPost.id);
  throw error;
}
```

## Quick Checklist

When adding controller methods:

- [ ] Does the name follow `fetch*/get*/getOrFetch*/commit*` pattern?
- [ ] Do write operations write to IndexedDB first?
- [ ] Is UI updated immediately (optimistic)?
- [ ] Does background sync handle failures gracefully?
- [ ] Is `useLiveQuery` used only for local reads?
