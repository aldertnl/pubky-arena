import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asInvalid } from '@/test-utils/type-assertions';
import { useCoverImagePicker } from './useCoverImagePicker';

const mockPrepare = vi.hoisted(() => vi.fn(async (file: File) => file));

vi.mock('@/hooks/usePrepareImageFile/usePrepareImageFile', () => ({
  usePrepareImageFile: () => ({ prepare: mockPrepare }),
}));

const stubbedUrl = vi.hoisted(() => ({
  createObjectURL: vi.fn<(file: File) => string>(() => 'blob:cover-mock'),
  revokeObjectURL: vi.fn(),
}));

const buildChangeEvent = (file: File | null): ChangeEvent<HTMLInputElement> =>
  asInvalid<ChangeEvent<HTMLInputElement>>({
    target: { files: file ? [file] : [], value: '' },
  });

describe('useCoverImagePicker', () => {
  beforeEach(() => {
    mockPrepare.mockClear();
    mockPrepare.mockImplementation(async (file: File) => file);
    stubbedUrl.createObjectURL.mockClear();
    stubbedUrl.revokeObjectURL.mockClear();
    vi.stubGlobal('URL', { ...URL, ...stubbedUrl });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts empty and exposes an initial preview URL when provided', () => {
    const { result } = renderHook(() => useCoverImagePicker({ initialPreviewUrl: 'https://cdn/x.png' }));

    expect(result.current.file).toBeNull();
    expect(result.current.previewUrl).toBe('https://cdn/x.png');
    expect(result.current.isCleared).toBe(false);
    expect(result.current.isPreparing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('accepts an image file, prepares it, and exposes a blob preview URL', async () => {
    const { result } = renderHook(() => useCoverImagePicker());

    const file = new File(['cover'], 'cover.png', { type: 'image/png' });
    const prepared = new File(['prepared'], 'cover.webp', { type: 'image/webp' });
    mockPrepare.mockResolvedValueOnce(prepared);

    await act(async () => {
      result.current.onInputChange(buildChangeEvent(file));
      await Promise.resolve();
    });

    expect(mockPrepare).toHaveBeenCalledWith(file);
    expect(stubbedUrl.createObjectURL).toHaveBeenCalledWith(prepared);
    expect(result.current.file).toBe(prepared);
    expect(result.current.previewUrl).toBe('blob:cover-mock');
    expect(result.current.isPreparing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('rejects non-image files with an `invalid-type` error and keeps state', () => {
    const { result } = renderHook(() => useCoverImagePicker());

    const file = new File(['notes'], 'notes.txt', { type: 'text/plain' });
    act(() => {
      result.current.onInputChange(buildChangeEvent(file));
    });

    expect(result.current.error).toBe('invalid-type');
    expect(result.current.file).toBeNull();
    expect(result.current.previewUrl).toBeNull();
    expect(mockPrepare).not.toHaveBeenCalled();
  });

  it('accepts large images and relies on prepareImageForUpload instead of a size cap', async () => {
    const { result } = renderHook(() => useCoverImagePicker());

    const file = new File(['12345678'], 'big.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 12 * 1024 * 1024 });

    await act(async () => {
      result.current.onInputChange(buildChangeEvent(file));
      await Promise.resolve();
    });

    expect(mockPrepare).toHaveBeenCalledWith(file);
    expect(result.current.error).toBeNull();
  });

  it('marks the picker cleared when removing an initial preview', () => {
    const { result } = renderHook(() => useCoverImagePicker({ initialPreviewUrl: 'https://cdn/x.png' }));

    act(() => {
      result.current.remove();
    });

    expect(result.current.previewUrl).toBeNull();
    expect(result.current.isCleared).toBe(true);
    expect(result.current.isPreparing).toBe(false);
  });

  it('reset() restores the initial preview and clears the file state', async () => {
    const { result } = renderHook(() => useCoverImagePicker({ initialPreviewUrl: 'https://cdn/x.png' }));

    const file = new File(['cover'], 'cover.png', { type: 'image/png' });
    await act(async () => {
      result.current.onInputChange(buildChangeEvent(file));
      await Promise.resolve();
    });
    expect(result.current.previewUrl).toBe('blob:cover-mock');

    act(() => {
      result.current.reset();
    });

    expect(result.current.file).toBeNull();
    expect(result.current.previewUrl).toBe('https://cdn/x.png');
    expect(result.current.isCleared).toBe(false);
    expect(stubbedUrl.revokeObjectURL).toHaveBeenCalled();
  });

  it('revokes the blob URL when the previewing file changes', async () => {
    const { result } = renderHook(() => useCoverImagePicker());

    const first = new File(['1'], 'first.png', { type: 'image/png' });
    const second = new File(['2'], 'second.png', { type: 'image/png' });

    await act(async () => {
      result.current.onInputChange(buildChangeEvent(first));
      await Promise.resolve();
    });
    await act(async () => {
      result.current.onInputChange(buildChangeEvent(second));
      await Promise.resolve();
    });

    expect(stubbedUrl.createObjectURL).toHaveBeenCalledTimes(2);
    expect(stubbedUrl.revokeObjectURL).toHaveBeenCalled();
  });
});
