// TODO:[Locks] #1998 / Spike #2058 — throwaway prototype, NOT production code.
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { deserializeLockBundle, serializeLockBundle } from './lockBundle';
import { LOCK_BUNDLE_MANIFEST_PATH, LOCK_BUNDLE_MAX_BYTES } from './lockBundle.constants';
import { toLocalAttachments } from './lockBundle.render';
import type { LockBundleInput } from './lockBundle.types';

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const mp4 = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74]);

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function makeFile(name: string, type: string, bytes: Uint8Array): File {
  return new File([toArrayBuffer(bytes)], name, { type });
}

const baseInput: LockBundleInput = {
  content: 'A locked post with **markdown** and media. https://pubky.org',
  kind: 'image',
  files: [makeFile('photo.jpg', 'image/jpeg', jpeg), makeFile('clip.mp4', 'video/mp4', mp4)],
};

/** Craft an arbitrary (possibly hostile) bundle for the negative-path tests. */
async function craftZip(
  manifest: unknown,
  media: Array<{ path: string; bytes: Uint8Array }> = [],
): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const m of media) zip.file(m.path, m.bytes, { compression: 'STORE' });
  if (manifest !== undefined) {
    zip.file(LOCK_BUNDLE_MANIFEST_PATH, typeof manifest === 'string' ? manifest : JSON.stringify(manifest));
  }
  return zip.generateAsync({ type: 'uint8array' });
}

describe('lockBundle round-trip', () => {
  it('serializes then deserializes back to the same content + attachments', async () => {
    const bytes = await serializeLockBundle(baseInput);
    expect(bytes.byteLength).toBeGreaterThan(0);

    const { manifest, attachments } = await deserializeLockBundle(bytes);

    expect(manifest.post.content).toBe(baseInput.content);
    expect(manifest.post.kind).toBe('image');

    expect(attachments).toHaveLength(2);
    expect(attachments[0]).toMatchObject({ name: 'photo.jpg', content_type: 'image/jpeg' });
    expect(Array.from(attachments[0].bytes)).toEqual(Array.from(jpeg));
    expect(attachments[1]).toMatchObject({ name: 'clip.mp4', content_type: 'video/mp4' });
    expect(Array.from(attachments[1].bytes)).toEqual(Array.from(mp4));
  });

  it('handles a text-only bundle (no attachments)', async () => {
    const bytes = await serializeLockBundle({ content: 'hello', kind: 'short', files: [] });
    const { manifest, attachments } = await deserializeLockBundle(bytes);
    expect(manifest.post.content).toBe('hello');
    expect(attachments).toHaveLength(0);
  });
});

describe('toLocalAttachments', () => {
  it('produces PostAttachments props with object URLs', async () => {
    const deserialized = await deserializeLockBundle(await serializeLockBundle(baseInput));
    const localAttachments = toLocalAttachments(deserialized);

    expect(localAttachments).toHaveLength(2);
    expect(localAttachments[0]).toMatchObject({ type: 'image/jpeg', name: 'photo.jpg' });
    expect(localAttachments[0].urls.main).toMatch(/^blob:/);
    expect(localAttachments[0].urls.feed).toMatch(/^blob:/);
  });
});

describe('lockBundle security guards', () => {
  it('rejects bytes that are not a ZIP', async () => {
    await expect(deserializeLockBundle(new Uint8Array([1, 2, 3]))).rejects.toMatchObject({ code: 'NOT_ZIP' });
  });

  it('rejects an over-size bundle before parsing', async () => {
    const tooBig = new Uint8Array(LOCK_BUNDLE_MAX_BYTES + 1);
    await expect(deserializeLockBundle(tooBig)).rejects.toMatchObject({ code: 'TOO_LARGE' });
  });

  it('rejects a missing manifest', async () => {
    const bytes = await craftZip(undefined, [{ path: 'media/0-a.jpg', bytes: jpeg }]);
    await expect(deserializeLockBundle(bytes)).rejects.toMatchObject({ code: 'MISSING_MANIFEST' });
  });

  it('rejects a non-JSON manifest', async () => {
    const bytes = await craftZip('not json{');
    await expect(deserializeLockBundle(bytes)).rejects.toMatchObject({ code: 'INVALID_MANIFEST_JSON' });
  });

  it('rejects unknown manifest fields (strict schema)', async () => {
    const bytes = await craftZip({
      post: { content: 'x', kind: 'short' },
      attachments: [],
      evil: 'smuggled',
    });
    await expect(deserializeLockBundle(bytes)).rejects.toMatchObject({ code: 'SCHEMA_INVALID' });
  });

  it('rejects a path-traversal attachment path', async () => {
    const bytes = await craftZip({
      post: { content: 'x', kind: 'image' },
      attachments: [{ path: '../evil', name: 'evil', content_type: 'image/jpeg', size: 4 }],
    });
    await expect(deserializeLockBundle(bytes)).rejects.toMatchObject({ code: 'SCHEMA_INVALID' });
  });

  it('rejects an unsupported MIME type', async () => {
    const bytes = await craftZip({
      post: { content: 'x', kind: 'image' },
      attachments: [{ path: 'media/0-a.bin', name: 'a.bin', content_type: 'application/x-evil', size: 4 }],
    });
    await expect(deserializeLockBundle(bytes)).rejects.toMatchObject({ code: 'SCHEMA_INVALID' });
  });

  it('rejects an undeclared extra entry', async () => {
    const manifest = {
      post: { content: 'x', kind: 'image' },
      attachments: [{ path: 'media/0-a.jpg', name: 'a.jpg', content_type: 'image/jpeg', size: jpeg.byteLength }],
    };
    const bytes = await craftZip(manifest, [
      { path: 'media/0-a.jpg', bytes: jpeg },
      { path: 'extra.txt', bytes: new Uint8Array([9, 9, 9]) },
    ]);
    await expect(deserializeLockBundle(bytes)).rejects.toMatchObject({ code: 'UNEXPECTED_ENTRY' });
  });

  it('rejects a declared/actual size mismatch', async () => {
    const manifest = {
      post: { content: 'x', kind: 'image' },
      attachments: [{ path: 'media/0-a.jpg', name: 'a.jpg', content_type: 'image/jpeg', size: 999 }],
    };
    const bytes = await craftZip(manifest, [{ path: 'media/0-a.jpg', bytes: jpeg }]);
    await expect(deserializeLockBundle(bytes)).rejects.toMatchObject({ code: 'SIZE_MISMATCH' });
  });
});
