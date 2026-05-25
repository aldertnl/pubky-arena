import { describe, expect, it } from 'vitest';
import type { ExistingAttachmentMeta } from './usePostInput.types';
import { hasRequiredMediaForEdit, isMediaExistingAttachment, isMediaFile } from './usePostInput.utils';

describe('usePostInput.utils', () => {
  const imageAttachment: ExistingAttachmentMeta = {
    uri: 'pubky://test/files/image',
    name: 'image.jpg',
    type: 'image/jpeg',
    previewUrl: 'https://cdn.example.com/image.jpg',
  };

  const pdfAttachment: ExistingAttachmentMeta = {
    uri: 'pubky://test/files/pdf',
    name: 'file.pdf',
    type: 'application/pdf',
    previewUrl: 'https://cdn.example.com/file.pdf',
  };

  it('detects image and video files as media', () => {
    expect(isMediaFile(new File([''], 'photo.jpg', { type: 'image/jpeg' }))).toBe(true);
    expect(isMediaFile(new File([''], 'clip.mp4', { type: 'video/mp4' }))).toBe(true);
    expect(isMediaFile(new File([''], 'file.pdf', { type: 'application/pdf' }))).toBe(false);
  });

  it('treats unknown existing attachment types as media', () => {
    expect(isMediaExistingAttachment({ ...imageAttachment, type: '' })).toBe(true);
    expect(isMediaExistingAttachment(imageAttachment)).toBe(true);
    expect(isMediaExistingAttachment(pdfAttachment)).toBe(false);
  });

  it('requires at least one media attachment when the original post had media', () => {
    const imageFile = new File([''], 'replacement.png', { type: 'image/png' });

    expect(hasRequiredMediaForEdit([], [], true, false)).toBe(false);
    expect(hasRequiredMediaForEdit([imageAttachment], [], true, false)).toBe(true);
    expect(hasRequiredMediaForEdit([], [imageFile], true, false)).toBe(true);
    expect(hasRequiredMediaForEdit([pdfAttachment], [], true, false)).toBe(false);
  });

  it('allows temporary removal in article edit mode', () => {
    expect(hasRequiredMediaForEdit([], [], true, true)).toBe(true);
  });
});
