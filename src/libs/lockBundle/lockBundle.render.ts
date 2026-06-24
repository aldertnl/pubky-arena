// TODO:[Locks] #1998 / Spike #2058 — throwaway adapter, NOT production code.
//
// Maps decoded bundle attachments → the object-URL props the existing
// PostAttachments component consumes (`AttachmentConstructed`). The raw bytes
// are wrapped in a Blob and an object URL; the owning store revokes those URLs
// when they are replaced, so no revoke bookkeeping is needed here.
import type { AttachmentConstructed } from '@/organisms/PostAttachments/PostAttachments.types';
import type { DeserializedLockBundle } from './lockBundle.types';

/** Copy into a fresh ArrayBuffer so the bytes are a valid `BlobPart` (not a generic ArrayBufferLike). */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export function toLocalAttachments(bundle: DeserializedLockBundle): AttachmentConstructed[] {
  return bundle.attachments.map((attachment) => {
    // The MIME was already checked against the spec allowlist during deserialize,
    // so labelling the Blob with it here is safe.
    const url = URL.createObjectURL(new Blob([toArrayBuffer(attachment.bytes)], { type: attachment.content_type }));
    // `feed` mirrors `main`: the image grid renders the `feed` variant for
    // non-gif images, while video/gif use `main`. One object URL serves both.
    return { type: attachment.content_type, name: attachment.name, urls: { main: url, feed: url } };
  });
}
