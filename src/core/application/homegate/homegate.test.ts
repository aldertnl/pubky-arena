import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Core from '@/core';
import { HttpMethod } from '@/libs';

const testData = {
  inviteCode: 'test-invite-code-123',
  verificationId: '550e8400-e29b-41d4-a716-446655440000',
  phoneNumber: '+1234567890',
  smsCode: '123456',
  pubky: 'pk1testpubky1234567890',
};

const mockPreimage = new Uint8Array(32).fill(0xab);
const mockHashBuffer = new ArrayBuffer(32);
new Uint8Array(mockHashBuffer).fill(0xcd);
const expectedPreimageHex = 'ab'.repeat(32);
const expectedHashHex = 'cd'.repeat(32);

describe('HomegateApplication', () => {
  let HomegateApplication: typeof import('./homegate').HomegateApplication;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock service methods
    vi.spyOn(Core.HomegateService, 'getLnVerificationInfo').mockResolvedValue({
      available: true,
      amountSat: 1000,
    });

    vi.spyOn(Core.HomegateService, 'createLnVerification').mockResolvedValue({
      id: testData.verificationId,
      bolt11Invoice: 'lnbc1000...',
      amountSat: 1000,
      expiresAt: Date.now() + 600000,
    });

    vi.spyOn(Core.HomegateService, 'awaitLnVerification').mockResolvedValue({
      success: true,
      data: {
        id: testData.verificationId,
        amountSat: 1000,
        expiresAt: Date.now() + 600000,
        isPaid: true,
        signupCode: 'signup-code-123',
        homeserverPubky: 'pk1homeserver...',
        createdAt: Date.now(),
      },
    });

    vi.spyOn(Core.HomegateService, 'verifySmsCode').mockResolvedValue({
      valid: true,
      signupCode: 'signup-code-123',
      homeserverPubky: 'pk1homeserver...',
    });

    vi.spyOn(Core.HomegateService, 'sendSmsCode').mockResolvedValue({
      success: true,
    });

    vi.spyOn(Core.ExchangerateService, 'getSatoshiUsdRate').mockResolvedValue({
      satUsd: 0.0005,
      btcUsd: 50000,
      lastUpdatedAt: new Date(),
    });

    vi.spyOn(Core.HomeserverService, 'request').mockResolvedValue(undefined as never);

    vi.spyOn(Core.HomegateService, 'requestInviteCode').mockResolvedValue({
      signupCode: 'invite-code-123',
    });

    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      new Uint8Array((array as Uint8Array).buffer).set(mockPreimage);
      return array;
    });
    vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(mockHashBuffer);

    const homegateModule = await import('./homegate');
    HomegateApplication = homegateModule.HomegateApplication;
  });

  describe('getLnVerificationInfo', () => {
    it('should delegate to HomegateService and return LN info', async () => {
      const result = await HomegateApplication.getLnVerificationInfo();

      expect(Core.HomegateService.getLnVerificationInfo).toHaveBeenCalled();
      expect(result).toEqual({ available: true, amountSat: 1000 });
    });
  });

  describe('createLnVerification', () => {
    it('should delegate to HomegateService and return verification details', async () => {
      const result = await HomegateApplication.createLnVerification();

      expect(Core.HomegateService.createLnVerification).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: testData.verificationId,
        bolt11Invoice: 'lnbc1000...',
        amountSat: 1000,
      });
    });
  });

  describe('awaitLnVerification', () => {
    it('should delegate to HomegateService with verification ID', async () => {
      const result = await HomegateApplication.awaitLnVerification(testData.verificationId);

      expect(Core.HomegateService.awaitLnVerification).toHaveBeenCalledWith(testData.verificationId);
      expect(result).toMatchObject({
        success: true,
        data: {
          id: testData.verificationId,
          isPaid: true,
          signupCode: 'signup-code-123',
        },
      });
    });
  });

  describe('verifySmsCode', () => {
    it('should delegate to HomegateService with phone number and code', async () => {
      const result = await HomegateApplication.verifySmsCode({
        phoneNumber: testData.phoneNumber,
        code: testData.smsCode,
      });

      expect(Core.HomegateService.verifySmsCode).toHaveBeenCalledWith({
        phoneNumber: testData.phoneNumber,
        code: testData.smsCode,
      });
      expect(result).toEqual({
        valid: true,
        signupCode: 'signup-code-123',
        homeserverPubky: 'pk1homeserver...',
      });
    });
  });

  describe('sendSmsCode', () => {
    it('should delegate to HomegateService with phone number', async () => {
      const result = await HomegateApplication.sendSmsCode(testData.phoneNumber);

      expect(Core.HomegateService.sendSmsCode).toHaveBeenCalledWith(testData.phoneNumber);
      expect(result).toEqual({ success: true });
    });
  });

  describe('getBtcRate', () => {
    it('should delegate to ExchangerateService and return BTC rate', async () => {
      const result = await HomegateApplication.getBtcRate();

      expect(Core.ExchangerateService.getSatoshiUsdRate).toHaveBeenCalled();
      expect(result).toMatchObject({
        satUsd: 0.0005,
        btcUsd: 50000,
      });
    });
  });

  describe('generateInviteCode', () => {
    it('should write hash proof to homeserver at the correct URL', async () => {
      await HomegateApplication.generateInviteCode(testData.pubky);

      expect(Core.HomeserverService.request).toHaveBeenCalledWith({
        method: HttpMethod.PUT,
        url: `pubky://${testData.pubky}/pub/pubky.app/homegate/proof`,
        bodyJson: { hash: expectedHashHex },
      });
    });

    it('should call requestInviteCode with pubky and preimage hex', async () => {
      await HomegateApplication.generateInviteCode(testData.pubky);

      expect(Core.HomegateService.requestInviteCode).toHaveBeenCalledWith({
        pubky: testData.pubky,
        hashProofPreimage: expectedPreimageHex,
      });
    });

    it('should return the signupCode from service', async () => {
      const result = await HomegateApplication.generateInviteCode(testData.pubky);

      expect(result).toEqual({ signupCode: 'invite-code-123' });
    });

    it('should throw if homeserver write fails', async () => {
      vi.spyOn(Core.HomeserverService, 'request').mockRejectedValue(new Error('homeserver write failed'));

      await expect(HomegateApplication.generateInviteCode(testData.pubky)).rejects.toThrow('homeserver write failed');
    });

    it('should throw if requestInviteCode fails', async () => {
      vi.spyOn(Core.HomegateService, 'requestInviteCode').mockRejectedValue(new Error('invite code request failed'));

      await expect(HomegateApplication.generateInviteCode(testData.pubky)).rejects.toThrow(
        'invite code request failed',
      );
    });
  });
});
