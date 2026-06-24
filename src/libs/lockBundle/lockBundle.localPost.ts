// TODO:[Locks] #1998 / Spike #2058 — throwaway, NOT production code.
//
// Writes the decoded bundle as a LOCAL-ONLY post (Dexie, no homeserver sync) and
// registers its attachments as object URLs, so the standard feed Post card —
// header, footer actions, card chrome — renders it through the normal timeline
// path. Mirrors the local half of PostController.commitCreate, minus the network.
import { buildCompositeId } from '@/models/models.utils';
import type { AttachmentConstructed } from '@/organisms/PostAttachments/PostAttachments.types';
import { inferPostKindForCreate } from '@/pipes/post/post.kind';
import { PostNormalizer } from '@/pipes/post/post.normalizer';
import { LocalPostService } from '@/services/local/post/post';
import { useLocalFilesStore } from '@/stores/localFiles/localFiles.store';
import type { DeserializedLockBundle } from './lockBundle.types';

export async function createLocalPostFromBundle(params: {
  bundle: DeserializedLockBundle;
  files: File[];
  isArticle: boolean;
  authorId: string;
  localAttachments: AttachmentConstructed[];
}): Promise<string> {
  const { bundle, files, isArticle, authorId, localAttachments } = params;
  const { content } = bundle.manifest.post;

  const kind = inferPostKindForCreate({ content, attachments: files, isArticle });

  // Build a real PubkyAppPost (no file URIs — the bytes are rendered locally via
  // object URLs registered below, the same mechanism optimistic posts use).
  const { post, meta } = await PostNormalizer.to(
    { content, kind, attachments: undefined, embed: undefined, parentUri: undefined },
    authorId,
  );

  const compositePostId = buildCompositeId({ pubky: authorId, id: meta.id });
  await LocalPostService.create({ compositePostId, post });
  useLocalFilesStore.getState().setPostAttachments(compositePostId, localAttachments);

  return compositePostId;
}
