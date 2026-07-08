import { describe, expect, it, vi } from 'vitest';
import { isPreparedImageUpload, prepareImageForUpload } from './prepareImageForUpload';
import { stripImageMetadata } from './stripImageMetadata';

vi.mock('./stripImageMetadata', () => ({
  stripImageMetadata: vi.fn(),
}));

describe('prepareImageForUpload', () => {
  it('sanitizes the file and marks it as prepared', async () => {
    const input = new File(['raw'], 'photo.png', { type: 'image/png' });
    const prepared = new File(['prepared'], 'photo.webp', { type: 'image/webp' });
    vi.mocked(stripImageMetadata).mockResolvedValueOnce(prepared);

    const result = await prepareImageForUpload(input);

    expect(stripImageMetadata).toHaveBeenCalledWith(input);
    expect(result).toBe(prepared);
    expect(isPreparedImageUpload(result)).toBe(true);
    expect(isPreparedImageUpload(input)).toBe(false);
  });
});
