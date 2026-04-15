import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as Config from '@/config';
import * as Core from '@/core';
import { parseNexusFileUrlsField } from '@/core/services/nexus/file/nexusFileUrls';

import { findFileForAttachmentUri, pickOpenGraphUrlFromFile, resolvePostOpenGraphImage } from './postOpenGraphImage';

const testPubky = 'operrr8wsbpr3ue9d4qj41ge1kcc6r7fdiy6o3ugjrrhi4y77rd0';
const fileId = '0034YYSQGEJH0';

function cdnFileUrl(pubky: string, id: string, variant: 'main' | 'feed' | 'small'): string {
  return `${Config.CDN_URL}/files/${encodeURIComponent(pubky)}/${encodeURIComponent(id)}/${variant}`;
}

const baseFile = (overrides: Partial<Core.NexusFileDetails>): Core.NexusFileDetails => ({
  id: fileId,
  name: 'f',
  src: `pubky://${testPubky}/pub/pubky.app/blobs/x`,
  content_type: 'image/png',
  size: 1,
  created_at: 0,
  indexed_at: 0,
  metadata: {},
  owner_id: testPubky,
  uri: `pubky://${testPubky}/pub/pubky.app/files/${fileId}`,
  urls: {
    main: 'https://cdn.example/main.png',
    feed: 'https://cdn.example/feed.png',
    small: 'https://cdn.example/small.png',
  },
  ...overrides,
});

const baseUser = (): Core.NexusUserDetails => ({
  name: 'Test User',
  bio: '',
  id: testPubky,
  links: null,
  status: null,
  image: 'v1',
  indexed_at: 0,
});

const basePost = (overrides: Partial<Core.NexusPostDetails>): Core.NexusPostDetails => ({
  id: 'post1',
  content: 'Hello',
  indexed_at: 0,
  author: testPubky,
  kind: 'short',
  uri: `pubky://${testPubky}/pub/pubky.app/posts/post1`,
  attachments: null,
  ...overrides,
});

describe('parseNexusFileUrlsField (re-exported usage)', () => {
  it('parses string urls JSON', () => {
    const parsed = parseNexusFileUrlsField(
      '{"feed":"https://f","main":"https://m","small":"https://s"}' as unknown as Core.NexusFileDetails['urls'],
    );
    expect(parsed.main).toBe('https://m');
  });
});

describe('findFileForAttachmentUri', () => {
  it('matches by exact uri', () => {
    const f = baseFile({});
    expect(findFileForAttachmentUri([f], f.uri)).toBe(f);
  });

  it('returns undefined when no file matches', () => {
    const f = baseFile({});
    expect(findFileForAttachmentUri([f], `pubky://${testPubky}/pub/pubky.app/files/otherid`)).toBeUndefined();
  });

  it('matches second file by composite id when attachment order references same id', () => {
    const f1 = baseFile({ id: 'a', uri: `pubky://${testPubky}/pub/pubky.app/files/a` });
    const f2 = baseFile({
      id: 'b',
      uri: `pubky://${testPubky}/pub/pubky.app/files/b`,
      content_type: 'image/jpeg',
    });
    expect(findFileForAttachmentUri([f1, f2], f2.uri)).toBe(f2);
  });
});

describe('pickOpenGraphUrlFromFile', () => {
  it('picks main for images', () => {
    const f = baseFile({ content_type: 'image/jpeg' });
    expect(pickOpenGraphUrlFromFile(f)).toBe(cdnFileUrl(testPubky, fileId, 'main'));
  });

  it('prefers feed for video thumbnails', () => {
    const f = baseFile({
      content_type: 'video/mp4',
    });
    expect(pickOpenGraphUrlFromFile(f)).toBe(cdnFileUrl(testPubky, fileId, 'feed'));
  });

  it('returns null for non-image non-video', () => {
    const f = baseFile({ content_type: 'application/pdf' });
    expect(pickOpenGraphUrlFromFile(f)).toBeNull();
  });
});

describe('resolvePostOpenGraphImage', () => {
  const avatarUrl = 'https://cdn.example/avatar/x';

  beforeEach(() => {
    vi.spyOn(Core.FileController, 'getAvatarUrl').mockReturnValue(avatarUrl);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns first image URL when Nexus returns image attachment', async () => {
    const img = baseFile({ content_type: 'image/png' });
    vi.spyOn(Core.NexusFileService, 'fetchFiles').mockResolvedValue([img]);

    const uri = img.uri;
    const url = await resolvePostOpenGraphImage(baseUser(), basePost({ attachments: [uri] }));

    expect(url).toBe(cdnFileUrl(testPubky, fileId, 'main'));
    expect(Core.NexusFileService.fetchFiles).toHaveBeenCalledWith([uri]);
  });

  it('skips non-visual attachment and uses next image', async () => {
    const pdf = baseFile({
      id: 'pdf1',
      uri: `pubky://${testPubky}/pub/pubky.app/files/pdf1`,
      content_type: 'application/pdf',
    });
    const img = baseFile({
      id: 'img2',
      uri: `pubky://${testPubky}/pub/pubky.app/files/img2`,
      content_type: 'image/gif',
    });
    vi.spyOn(Core.NexusFileService, 'fetchFiles').mockResolvedValue([pdf, img]);

    const url = await resolvePostOpenGraphImage(baseUser(), basePost({ attachments: [pdf.uri, img.uri] }));

    expect(url).toBe(cdnFileUrl(testPubky, 'img2', 'main'));
  });

  it('returns avatar when fetchFiles throws', async () => {
    vi.spyOn(Core.NexusFileService, 'fetchFiles').mockRejectedValue(new Error('network'));

    const url = await resolvePostOpenGraphImage(
      baseUser(),
      basePost({ attachments: [`pubky://${testPubky}/pub/pubky.app/files/x`] }),
    );

    expect(url).toBe(avatarUrl);
    expect(Core.FileController.getAvatarUrl).toHaveBeenCalledWith(testPubky, 'v1');
  });

  it('returns avatar when there are no attachments', async () => {
    const fetchSpy = vi.spyOn(Core.NexusFileService, 'fetchFiles');

    const url = await resolvePostOpenGraphImage(baseUser(), basePost({ attachments: null }));

    expect(url).toBe(avatarUrl);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
