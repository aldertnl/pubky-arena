import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/libs/error/error';
import { ValidationErrorCode } from '@/libs/error/error.codes';
import { ErrorCategory } from '@/libs/error/error.types';
import { buildStarterPackStreamId, USER_STREAM_TAG_DELIMITER } from './userStream.helper';

const expectValidationError = (fn: () => unknown) => {
  try {
    fn();
    expect.fail('Should have thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    const appError = error as AppError;
    expect(appError.category).toBe(ErrorCategory.Validation);
    expect(appError.code).toBe(ValidationErrorCode.INVALID_INPUT);
  }
};

describe('buildStarterPackStreamId', () => {
  // The checked-in STARTER_PACK_SOURCE_LIVE flag is false until Nexus deploys the
  // starter_pack source to staging (#2390 flips it and removes the mock namespace).
  describe('with the shipped flag value (mock namespace)', () => {
    it('should join ordered tags under the mock namespace', () => {
      expect(buildStarterPackStreamId(['bitcoin', 'music'])).toBe('starter_pack_mock:all:all:bitcoin,music');
    });

    it('should preserve tag order (reversed lists yield distinct IDs)', () => {
      const forward = buildStarterPackStreamId(['travel', 'music']);
      const reversed = buildStarterPackStreamId(['music', 'travel']);

      expect(forward).toBe('starter_pack_mock:all:all:travel,music');
      expect(reversed).toBe('starter_pack_mock:all:all:music,travel');
      expect(forward).not.toBe(reversed);
    });

    it('should canonicalize labels so casing/whitespace variants map to one ID', () => {
      const fromMixedCase = buildStarterPackStreamId(['Bitcoin ', 'MUSIC']);
      const fromCanonical = buildStarterPackStreamId(['bitcoin', 'music']);

      expect(fromMixedCase).toBe(fromCanonical);
      expect(fromMixedCase).toBe('starter_pack_mock:all:all:bitcoin,music');
    });

    it('should accept the maximum of 5 tags', () => {
      expect(buildStarterPackStreamId(['a', 'b', 'c', 'd', 'e'])).toBe('starter_pack_mock:all:all:a,b,c,d,e');
    });

    it('should accept a single tag', () => {
      expect(buildStarterPackStreamId(['bitcoin'])).toBe('starter_pack_mock:all:all:bitcoin');
    });
  });

  describe('validation', () => {
    it('should reject an empty tag list', () => {
      expectValidationError(() => buildStarterPackStreamId([]));
    });

    it('should reject more than 5 tags', () => {
      expectValidationError(() => buildStarterPackStreamId(['a', 'b', 'c', 'd', 'e', 'f']));
    });

    it('should reject empty and whitespace-only labels', () => {
      expectValidationError(() => buildStarterPackStreamId(['']));
      expectValidationError(() => buildStarterPackStreamId(['   ']));
    });

    it('should reject labels with inner whitespace (banned characters)', () => {
      expectValidationError(() => buildStarterPackStreamId(['rock music']));
      expectValidationError(() => buildStarterPackStreamId(['tab\there']));
      expectValidationError(() => buildStarterPackStreamId(['new\nline']));
    });

    it('should reject labels containing the tag delimiter', () => {
      expectValidationError(() => buildStarterPackStreamId([`bit${USER_STREAM_TAG_DELIMITER}coin`]));
    });

    it('should reject labels containing the stream ID delimiter', () => {
      expectValidationError(() => buildStarterPackStreamId(['bit:coin']));
    });

    it('should reject overlength labels (>20 chars)', () => {
      expectValidationError(() => buildStarterPackStreamId(['a'.repeat(21)]));
    });

    it('should accept a label at exactly 20 chars', () => {
      expect(buildStarterPackStreamId(['a'.repeat(20)])).toContain(`:${'a'.repeat(20)}`);
    });
  });

  describe('STARTER_PACK_SOURCE_LIVE flag', () => {
    it('should emit the live namespace when the flag is true', async () => {
      vi.resetModules();
      vi.doMock('@/config/nexus', async (importOriginal) => ({
        ...(await importOriginal<typeof import('@/config/nexus')>()),
        STARTER_PACK_SOURCE_LIVE: true,
      }));

      const { buildStarterPackStreamId: buildWithLiveFlag } = await import('./userStream.helper');

      expect(buildWithLiveFlag(['bitcoin', 'music'])).toBe('starter_pack:all:all:bitcoin,music');

      vi.doUnmock('@/config/nexus');
      vi.resetModules();
    });

    it('should emit the mock namespace when the flag is false', async () => {
      vi.resetModules();
      vi.doMock('@/config/nexus', async (importOriginal) => ({
        ...(await importOriginal<typeof import('@/config/nexus')>()),
        STARTER_PACK_SOURCE_LIVE: false,
      }));

      const { buildStarterPackStreamId: buildWithMockFlag } = await import('./userStream.helper');

      expect(buildWithMockFlag(['bitcoin', 'music'])).toBe('starter_pack_mock:all:all:bitcoin,music');

      vi.doUnmock('@/config/nexus');
      vi.resetModules();
    });
  });
});
