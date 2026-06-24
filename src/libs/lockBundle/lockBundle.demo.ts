// TODO:[Locks] #1998 / Spike #2058 — throwaway browser demo, NOT production code.
//
// Intercepts the composer's Post button: instead of a network write it builds
// the ZIP bundle, holds it in memory for 5s, then decodes it back — narrating
// every step to the console so the round-trip is visible without a backend.
import { buildLockBundleParts, deserializeLockBundle, serializeLockBundle } from './lockBundle';
import { LOCK_BUNDLE_CONTENT_TYPE } from './lockBundle.constants';
import { createLocalPostFromBundle } from './lockBundle.localPost';
import { toLocalAttachments } from './lockBundle.render';
import type { LockPostKind } from './lockBundle.types';

/** Master switch for the spike demo. Flip to `false` to restore real posting. */
export const LOCK_BUNDLE_SPIKE_DEMO_ENABLED = true;

/** Console prefix so this demo's output can be filtered in the browser console. */
const TAG = '[#2058: blob structure]';

const URL_RE = /https?:\/\/[^\s]+/g;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mirror of `inferPostKindForCreate` ordering, kept self-contained for the spike. */
function inferKind(files: File[], isArticle: boolean, hasLinks: boolean): LockPostKind {
  if (isArticle) return 'long';
  if (hasLinks) return 'link';
  if (files.some((f) => f.type.startsWith('video/'))) return 'video';
  if (files.some((f) => f.type.startsWith('image/'))) return 'image';
  if (files.length > 0) return 'file';
  return 'short';
}

export async function runLockBundleSpikeDemo(input: {
  content: string;
  files: File[];
  isArticle: boolean;
  authorId: string | null;
  prependPost: (postId: string) => void;
}): Promise<void> {
  const { content, files, isArticle, authorId, prependPost } = input;
  const links = content.match(URL_RE) ?? undefined;
  const kind = inferKind(files, isArticle, links != null);

  console.group(`%c${TAG} compose → zip → decode`, 'color:#7c3aed;font-weight:bold;');
  try {
    // ① pre-zip manifest (the structure we are about to pack)
    const { manifest } = await buildLockBundleParts({ content, kind, files });
    console.log(`%c${TAG} ① manifest (pre-zip):`, 'color:#2563eb;font-weight:bold;');
    console.log(TAG, JSON.stringify(manifest, null, 2));

    // ② build the ZIP — kept in memory, no network call
    const bytes = await serializeLockBundle({ content, kind, files });
    console.log(
      `%c${TAG} ② zip built — ${bytes.byteLength} bytes, content-type "${LOCK_BUNDLE_CONTENT_TYPE}" (no network call)`,
      'color:#16a34a;font-weight:bold;',
    );

    // ③ hold the in-memory bytes, count down
    console.log(`%c${TAG} ③ holding zip in memory, decoding in 5s…`, 'color:#ca8a04;font-weight:bold;');
    for (let n = 5; n >= 1; n--) {
      console.log(`${TAG}    ⏳ ${n}…`);
      await sleep(1000);
    }

    // ④ decode the same in-memory bytes and show the unpacked structure
    const decoded = await deserializeLockBundle(bytes);
    console.log(`%c${TAG} ④ decoded structure:`, 'color:#dc2626;font-weight:bold;');
    console.log(TAG, {
      // post.json — parsed: the post body + the attachment index it declares
      'post.json': decoded.manifest,
      // media/ — the actual extracted files
      'media/': decoded.attachments.map((a) => ({
        name: a.name,
        content_type: a.content_type,
        size: a.bytes.byteLength,
      })),
    });

    const matches = JSON.stringify(decoded.manifest) === JSON.stringify(manifest);
    console.log(
      `%c${TAG} ✔ decoded manifest matches pre-zip manifest: ${matches}`,
      `color:${matches ? '#16a34a' : '#dc2626'};font-weight:bold;`,
    );

    // ⑤ render the decoded bundle as a REAL post at the top of the feed (no network):
    // a normal local post card with header, footer actions and attachments.
    if (authorId) {
      const localAttachments = toLocalAttachments(decoded);
      const postId = await createLocalPostFromBundle({ bundle: decoded, files, isArticle, authorId, localAttachments });
      prependPost(postId);
      console.log(
        `%c${TAG} ⑤ decoded bundle rendered as a real post in the feed (id ${postId})`,
        'color:#7c3aed;font-weight:bold;',
      );
    } else {
      console.warn(`${TAG} ⑤ skipped feed render — no authenticated user`);
    }
  } catch (error) {
    console.error(`${TAG} failed:`, error);
  } finally {
    console.groupEnd();
  }
}
