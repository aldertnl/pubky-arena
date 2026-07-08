'use client';

import { type ChangeEvent, type RefObject, useEffect, useRef, useState } from 'react';
import { usePrepareImageFile } from '@/hooks/usePrepareImageFile/usePrepareImageFile';

type CoverImagePickerError = 'invalid-type';

type UseCoverImagePickerParams = {
  /**
   * Existing cover image URL (e.g. a `pubky://` URL on edit). When set, it is
   * surfaced as `previewUrl` until the user picks a new file or removes it.
   */
  initialPreviewUrl?: string | null;
};

export type UseCoverImagePickerResult = {
  /** Newly picked file. `null` when the user has not picked a file in this session. */
  file: File | null;
  /** URL to render in the UI: blob URL for a new file, or `initialPreviewUrl` until cleared. */
  previewUrl: string | null;
  /** `true` when the user explicitly removed an `initialPreviewUrl` without picking a new file. */
  isCleared: boolean;
  /** `true` while the picked image is being sanitized/compressed for upload. */
  isPreparing: boolean;
  /** Validation error from the last `onInputChange`. Codes are translated by the consumer. */
  error: CoverImagePickerError | null;
  /** Ref to the hidden `<input type="file">` element managed by the consumer. */
  inputRef: RefObject<HTMLInputElement | null>;
  /** Wire to `<input type="file" onChange={...}>`. */
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Open the native file picker by clicking the hidden input. */
  choose: () => void;
  /** Clear the current preview/file (also clears any initial preview). */
  remove: () => void;
  /** Reset to the initial state (re-shows `initialPreviewUrl`). */
  reset: () => void;
};

/**
 * Manages the lifecycle of a cover image picker — file state, blob preview,
 * eager image preparation, validation, and cleanup of object URLs. Designed for
 * create/edit flows where the cover image is uploaded separately and only the
 * resulting URL is stored in the collection envelope.
 *
 * Images of any size are accepted; {@link prepareImageForUpload} runs on pick
 * so the stored file is always within the homeserver moderation limit.
 */
export function useCoverImagePicker({
  initialPreviewUrl = null,
}: UseCoverImagePickerParams = {}): UseCoverImagePickerResult {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isInitialCleared, setIsInitialCleared] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<CoverImagePickerError | null>(null);
  const { prepare } = usePrepareImageFile();

  // Revoke any blob URL we created when it changes or on unmount.
  useEffect(() => {
    return () => {
      if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const clearLocalPreview = () => {
    setLocalPreviewUrl((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const clearNativeInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const choose = () => {
    inputRef.current?.click();
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    if (!next) return;

    if (!next.type.startsWith('image/')) {
      setError('invalid-type');
      clearNativeInput();
      return;
    }

    setError(null);
    setIsPreparing(true);

    void (async () => {
      try {
        const prepared = await prepare(next);
        if (!prepared) return;

        setLocalPreviewUrl((prev) => {
          if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return URL.createObjectURL(prepared);
        });
        setFile(prepared);
        setIsInitialCleared(false);
      } finally {
        setIsPreparing(false);
        clearNativeInput();
      }
    })();
  };

  const remove = () => {
    setFile(null);
    clearLocalPreview();
    setIsInitialCleared(true);
    setError(null);
    setIsPreparing(false);
    clearNativeInput();
  };

  const reset = () => {
    setFile(null);
    clearLocalPreview();
    setIsInitialCleared(false);
    setError(null);
    setIsPreparing(false);
    clearNativeInput();
  };

  const previewUrl = localPreviewUrl ?? (isInitialCleared ? null : (initialPreviewUrl ?? null));

  return {
    file,
    previewUrl,
    isCleared: isInitialCleared && !file,
    isPreparing,
    error,
    inputRef,
    onInputChange,
    choose,
    remove,
    reset,
  };
}
