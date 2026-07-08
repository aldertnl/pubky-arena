import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareImageForUpload } from '@/libs/image/prepareImageForUpload';
import { IMAGE_EXCEEDS_UPLOAD_SIZE_ERROR } from '@/libs/image/stripImageMetadata';
import { usePrepareImageFile } from './usePrepareImageFile';

const mockToast = vi.hoisted(() => vi.fn());

vi.mock('@/libs/image/prepareImageForUpload', () => ({
  prepareImageForUpload: vi.fn(),
}));

vi.mock('@/molecules/Toaster/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('usePrepareImageFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the prepared file when prepareImageForUpload succeeds', async () => {
    const input = new File(['raw'], 'photo.png', { type: 'image/png' });
    const prepared = new File(['prepared'], 'photo.webp', { type: 'image/webp' });
    vi.mocked(prepareImageForUpload).mockResolvedValueOnce(prepared);

    const { result } = renderHook(() => usePrepareImageFile());

    let output: File | null = null;
    await act(async () => {
      output = await result.current.prepare(input);
    });

    expect(prepareImageForUpload).toHaveBeenCalledWith(input);
    expect(output).toBe(prepared);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('shows a compression toast and returns null when the upload size limit cannot be met', async () => {
    const input = new File(['raw'], 'huge.png', { type: 'image/png' });
    vi.mocked(prepareImageForUpload).mockRejectedValueOnce(new Error(IMAGE_EXCEEDS_UPLOAD_SIZE_ERROR));

    const { result } = renderHook(() => usePrepareImageFile());

    let output: File | null = null;
    await act(async () => {
      output = await result.current.prepare(input);
    });

    expect(output).toBeNull();
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Image could not be compressed below 5 MB. Try a smaller image or a different format.',
    });
  });

  it('shows a generic preparation toast and returns null for other failures', async () => {
    const input = new File(['raw'], 'photo.png', { type: 'image/png' });
    vi.mocked(prepareImageForUpload).mockRejectedValueOnce(new Error('decode failed'));

    const { result } = renderHook(() => usePrepareImageFile());

    let output: File | null = null;
    await act(async () => {
      output = await result.current.prepare(input);
    });

    expect(output).toBeNull();
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Could not prepare image for upload. Try again.',
    });
  });
});
