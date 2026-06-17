import { postUriBuilder } from 'pubky-app-specs';
import { isValidPostCompositeId } from '@/libs/utils/utils';
import { CompositeIdDomain } from '@/models/models.types';
import { buildCompositeId, buildCompositeIdFromPubkyUri, parseCompositeId } from '@/models/models.utils';

const WEB_POST_PROTOCOLS = new Set(['http:', 'https:']);
const POST_ROUTE_SEGMENT = 'post';

export type ResolvedPostUrl = {
  compositeId: string;
  itemUri: string;
};

function decodeSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

function resolveCompositeId(compositeId: string): ResolvedPostUrl | null {
  if (!isValidPostCompositeId(compositeId)) return null;

  const { pubky, id } = parseCompositeId(compositeId);
  return {
    compositeId,
    itemUri: postUriBuilder(pubky, id),
  };
}

function resolvePubkyPostUri(value: string): ResolvedPostUrl | null {
  const compositeId = buildCompositeIdFromPubkyUri({
    uri: value,
    domain: CompositeIdDomain.POSTS,
  });

  return compositeId ? resolveCompositeId(compositeId) : null;
}

function resolveWebPostUrl(value: string): ResolvedPostUrl | null {
  let url: URL;
  try {
    url = value.startsWith('/') ? new URL(value, 'https://pubky.app') : new URL(value);
  } catch {
    return null;
  }

  if (!WEB_POST_PROTOCOLS.has(url.protocol)) return null;

  const [route, rawAuthor, rawPostId, ...extraSegments] = url.pathname.split('/').filter(Boolean);
  if (route !== POST_ROUTE_SEGMENT || extraSegments.length > 0 || !rawAuthor || !rawPostId) {
    return null;
  }

  const authorPubky = decodeSegment(rawAuthor);
  const postId = decodeSegment(rawPostId);
  if (!authorPubky || !postId) return null;

  return resolveCompositeId(buildCompositeId({ pubky: authorPubky, id: postId }));
}

/**
 * Resolve a pasted post candidate to the canonical post identity.
 *
 * Supported input:
 * - `pubky://<author>/pub/pubky.app/posts/<postId>`
 * - `https://<host>/post/<author>/<postId>` (query/hash ignored)
 * - `/post/<author>/<postId>` for internal route hand-offs and tests
 */
export function resolvePostUrl(value: string): ResolvedPostUrl | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('pubky://')) {
    return resolvePubkyPostUri(trimmed);
  }

  return resolveWebPostUrl(trimmed);
}

export function collectionItemsIncludePost(items: readonly string[] | null | undefined, itemUri: string): boolean {
  const target = resolvePostUrl(itemUri)?.itemUri ?? itemUri.trim();
  if (!target) return false;

  return (items ?? []).some((item) => {
    const resolved = resolvePostUrl(item);
    return (resolved?.itemUri ?? item.trim()) === target;
  });
}
