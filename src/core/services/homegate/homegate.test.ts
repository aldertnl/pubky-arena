import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomegateService } from './homegate';
import { asOpaque } from '@/test-utils';

const mockFetch = vi.fn();
global.fetch = asOpaque<typeof global.fetch>(mockFetch);

describe('HomegateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('awaitLnVerification', () => {
    it('returns a rate-limited result for 429 responses', async () => {
      mockFetch.mockResolvedValue(
        new Response(null, {
          status: 429,
          statusText: 'Too Many Requests',
          headers: { 'retry-after': '7' },
        }),
      );

      const verificationId = '550e8400-e29b-41d4-a716-446655440000';
      const result = await HomegateService.awaitLnVerification(verificationId);

      expect(result).toEqual({
        success: false,
        rateLimited: true,
        retryAfter: 7,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/ln_verification/${verificationId}/await`),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('parses Retry-After when header is an HTTP-date', async () => {
      vi.useFakeTimers();
      try {
        const now = new Date('2026-02-12T12:00:00.000Z');
        vi.setSystemTime(now);

        mockFetch.mockResolvedValue(
          new Response(null, {
            status: 429,
            statusText: 'Too Many Requests',
            headers: { 'retry-after': new Date(now.getTime() + 3500).toUTCString() },
          }),
        );

        const verificationId = '550e8400-e29b-41d4-a716-446655440000';
        const result = await HomegateService.awaitLnVerification(verificationId);

        expect(result).toEqual({
          success: false,
          rateLimited: true,
          retryAfter: 3,
        });
      } finally {
        vi.useRealTimers();
      }
    });

    it('forwards abort signal to fetch when provided', async () => {
      mockFetch.mockResolvedValue(
        new Response(null, {
          status: 429,
          statusText: 'Too Many Requests',
          headers: { 'retry-after': '1' },
        }),
      );

      const verificationId = '550e8400-e29b-41d4-a716-446655440000';
      const controller = new AbortController();
      await HomegateService.awaitLnVerification(verificationId, controller.signal);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/ln_verification/${verificationId}/await`),
        expect.objectContaining({ method: 'GET', signal: controller.signal }),
      );
    });
  });

  describe('sendSmsCode', () => {
    it('sends SMS code successfully', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

      const result = await HomegateService.sendSmsCode('+1234567890');

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sms_verification/send_code'),
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('returns blocked error for 403 response', async () => {
      mockFetch.mockResolvedValue(new Response(null, { status: 403 }));

      const result = await HomegateService.sendSmsCode('+1234567890');

      expect(result).toEqual({ success: false, errorType: 'blocked' });
    });

    it('returns rate limited error with retry-after for 429 response', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ error: 'too many requests' }), {
          status: 429,
          headers: { 'retry-after': '60' },
        }),
      );

      const result = await HomegateService.sendSmsCode('+1234567890');

      expect(result).toEqual({
        success: false,
        errorType: 'rate_limited_temporary',
        retryAfter: 60,
      });
    });

    it('returns weekly rate limit error when error message contains weekly', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ error: 'Weekly limit exceeded' }), { status: 429 }));

      const result = await HomegateService.sendSmsCode('+1234567890');

      expect(result).toEqual({ success: false, errorType: 'rate_limited_weekly' });
    });

    it('returns yearly rate limit error when error message contains yearly', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ error: 'Yearly limit exceeded' }), { status: 429 }));

      const result = await HomegateService.sendSmsCode('+1234567890');

      expect(result).toEqual({ success: false, errorType: 'rate_limited_yearly' });
    });
  });

  describe('requestInviteCode', () => {
    it('sends PUT request with correct body', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ signupCode: 'test-code' }), { status: 200 }));

      const params = { pubky: 'z6Mk_test_pubky', hashProofPreimage: 'abc123hex' };
      await HomegateService.requestInviteCode(params);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/invite'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ pubky: 'z6Mk_test_pubky', hashProofPreimage: 'abc123hex' }),
        }),
      );
    });

    it('returns signupCode on success', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ signupCode: 'ABC123' }), { status: 200 }));

      const result = await HomegateService.requestInviteCode({
        pubky: 'z6Mk_test_pubky',
        hashProofPreimage: 'abc123hex',
      });

      expect(result).toEqual({ signupCode: 'ABC123' });
    });

    it('throws error with backend message when error response has JSON body with error field', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Invite code limit reached' }), {
          status: 403,
          statusText: 'Forbidden',
        }),
      );

      const promise = HomegateService.requestInviteCode({
        pubky: 'z6Mk_test_pubky',
        hashProofPreimage: 'abc123hex',
      });

      await expect(promise).rejects.toThrow('Invite code limit reached');
    });

    it('throws error with HTTP statusText when error response body has no error field', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ message: 'something else' }), {
          status: 500,
          statusText: 'Internal Server Error',
        }),
      );

      const promise = HomegateService.requestInviteCode({
        pubky: 'z6Mk_test_pubky',
        hashProofPreimage: 'abc123hex',
      });

      await expect(promise).rejects.toThrow('Internal Server Error');
    });

    it('throws error with plain text body when error response is not valid JSON', async () => {
      mockFetch.mockResolvedValue(
        new Response('Proof verification failed: hash does not match', {
          status: 422,
          statusText: 'Unprocessable Entity',
        }),
      );

      const promise = HomegateService.requestInviteCode({
        pubky: 'z6Mk_test_pubky',
        hashProofPreimage: 'abc123hex',
      });

      await expect(promise).rejects.toThrow('Proof verification failed: hash does not match');
    });

    it('throws error on non-OK response with null body', async () => {
      mockFetch.mockResolvedValue(new Response(null, { status: 500, statusText: 'Internal Server Error' }));

      const promise = HomegateService.requestInviteCode({
        pubky: 'z6Mk_test_pubky',
        hashProofPreimage: 'abc123hex',
      });

      await expect(promise).rejects.toThrow();
    });
  });
});
