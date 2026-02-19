# Data Patterns

Rules for data handling patterns. Based on ADR-0002, ADR-0003, ADR-0005, ADR-0006.

## Composite Post IDs (ADR-0002)

Posts use composite key format: `author:postId`

### Format

```typescript
type CompositePostId = `${Pubky}:${PostId}`;

// Example
const id = 'pk1abc123xyz:0000000123';
//           ^author^   :^postId^
```

### Utilities

```typescript
const compositeId = `${author}:${postId}`;

function parsePostId(composite: string): { author: string; postId: string } {
  const [author, postId] = composite.split(':');
  return { author, postId };
}

interface PostDetails {
  id: string; // "author:postId"
  author: string; // Pubky
  content: string;
}
```

### Why Composite IDs?

- Globally unique (author + timestamp)
- Stable for joins between Dexie tables
- Prevents collisions after migrations
- Retains chronological ordering

## Streams as Caches (ADR-0003)

Streams are cached sequences in Dexie with ordering metadata.

### Stream Structure

```typescript
interface StreamEntry {
  streamId: string; // Stream identifier
  postId: string; // Composite post ID
  order: number; // Position in stream
  cursor: string; // Server pagination cursor
  fetchedAt: number; // Timestamp for TTL
}
```

### Stream Operations

```typescript
// Reading from stream (fast, local)
const posts = await LocalStreamService.getStreamPosts(streamId);

// Refreshing stream (network + cache update)
await StreamApplication.refresh(streamId);

// Resuming pagination
const nextPage = await StreamApplication.fetchNext(streamId, cursor);
```

### Stream Invalidation

```typescript
const isStale = await TtlService.isExpired(streamId);
await LocalStreamService.invalidate(streamId);
```

## TTL Management (ADR-0005)

Per-entity TTL tracking for cache freshness.

### TTL Tables

```typescript
user_ttl: {
  pubky: string;
  expiresAt: number;
}
post_ttl: {
  postId: string;
  expiresAt: number;
}
stream_ttl: {
  streamId: string;
  expiresAt: number;
}
```

### TTL Operations

```typescript
const isFresh = await TtlService.check('post', postId);
await TtlService.touch('post', postId, TTL_DURATION);
const expired = await TtlService.getExpired('post');
```

### TTL on Writes

```typescript
// Always update TTL when writing
await LocalPostService.upsert(post);
await TtlService.touch('post', post.id, POST_TTL);

// Forgetting TTL update = stale cache that won't refresh
```

### TTL Constants

```typescript
const TTL = {
  USER: 5 * 60 * 1000, // 5 minutes
  POST: 10 * 60 * 1000, // 10 minutes
  STREAM: 2 * 60 * 1000, // 2 minutes
};
```

## Pipes Normalization (ADR-0006)

Pipes normalize external data to domain shapes.

### Pipe Responsibilities

```typescript
// Pipes DO:
// - Transform external shapes → domain shapes
// - Validate input data
// - Enforce pubky-app-specs
// - Return normalized objects

// Pipes DON'T:
// - Perform IO (network, database)
// - Have side effects
// - Access stores
```

### Pipe Structure

```typescript
// src/core/posts/pipes/post.pipe.ts

export class PostPipe {
  static normalizeFromNexus(raw: NexusPost): Post {
    return {
      id: `${raw.author}:${raw.id}`,
      author: raw.author,
      content: raw.content,
      createdAt: raw.indexed_at,
      attachments: raw.attachments?.map(AttachmentPipe.normalize) ?? [],
    };
  }

  static normalizeCreate(input: CreatePostInput): Post {
    if (!input.content?.trim()) {
      throw createCommonError(CommonErrorType.INVALID_INPUT, {
        field: 'content',
        message: 'Content is required',
      });
    }

    return {
      id: generatePostId(),
      content: input.content.trim(),
    };
  }
}
```

### Where to Use Pipes

```typescript
// Controllers call pipes before application
class PostController {
  static async commitCreatePost(input: CreatePostInput) {
    const post = PostPipe.normalizeCreate(input);
    await PostApplication.create(post);
  }
}

// Services call pipes for external data
class NexusPostService {
  static async fetch(id: string) {
    const raw = await queryNexus(`/v0/post/${id}`);
    return PostPipe.normalizeFromNexus(raw);
  }
}
```

### Never Return Un-normalized Data

```typescript
// BAD: Returning raw external shape
return await queryNexus(`/v0/post/${id}`);

// GOOD: Always normalize
const raw = await queryNexus(`/v0/post/${id}`);
return PostPipe.normalizeFromNexus(raw);
```

## Data Model Reference

### User Tables

```
user_details      — Profile data
user_counts       — Follower/following counts
user_relationships — Follow relationships
user_ttl          — Cache expiry
```

### Post Tables

```
post_details      — Post content
post_counts       — Like/reply counts
post_relationships — Author relationships
post_tags         — Tag associations
post_ttl          — Cache expiry
```

### Stream Tables

```
post_streams      — Post IDs in streams
user_streams      — User pubkys in streams
tag_streams       — Hot tags
```

## Quick Checklist

When working with data:

- [ ] Using composite IDs for posts (`author:postId`)?
- [ ] Stream entries have ordering metadata?
- [ ] TTL updated on every write?
- [ ] External data normalized through pipes?
- [ ] Pipes are pure (no IO)?
