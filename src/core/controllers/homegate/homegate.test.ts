import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Core from '@/core';

describe('HomegateController', () => {
  let HomegateController: typeof import('./homegate').HomegateController;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock HomegateApplication
    vi.spyOn(Core.HomegateApplication, 'generateInviteCode').mockResolvedValue({
      signupCode: 'test-invite-code',
    });

    // Mock auth store to return an authenticated user by default
    vi.spyOn(Core.useAuthStore, 'getState').mockReturnValue({
      currentUserPubky: 'test-pubky-123',
    } as unknown as Core.AuthStore);

    // Import HomegateController
    const homegateModule = await import('./homegate');
    HomegateController = homegateModule.HomegateController;
  });

  describe('fetchInviteCode', () => {
    it('should delegate to HomegateApplication with pubky from auth store', async () => {
      const generateSpy = vi.spyOn(Core.HomegateApplication, 'generateInviteCode');

      await HomegateController.fetchInviteCode();

      expect(generateSpy).toHaveBeenCalledWith('test-pubky-123');
    });

    it('should return the invite code result from application', async () => {
      vi.spyOn(Core.HomegateApplication, 'generateInviteCode').mockResolvedValue({
        signupCode: 'invite-abc',
      });

      const result = await HomegateController.fetchInviteCode();

      expect(result).toEqual({ signupCode: 'invite-abc' });
    });

    it('should throw validation error when user is not authenticated (pubky is null)', async () => {
      vi.spyOn(Core.useAuthStore, 'getState').mockReturnValue({
        currentUserPubky: null,
      } as unknown as Core.AuthStore);

      await expect(HomegateController.fetchInviteCode()).rejects.toThrow(
        'User must be authenticated to generate invite codes',
      );
    });

    it('should throw validation error when user is not authenticated (pubky is undefined)', async () => {
      vi.spyOn(Core.useAuthStore, 'getState').mockReturnValue({
        currentUserPubky: undefined,
      } as unknown as Core.AuthStore);

      await expect(HomegateController.fetchInviteCode()).rejects.toThrow(
        'User must be authenticated to generate invite codes',
      );
    });

    it('should propagate application errors', async () => {
      vi.spyOn(Core.HomegateApplication, 'generateInviteCode').mockRejectedValue(new Error('Application error'));

      await expect(HomegateController.fetchInviteCode()).rejects.toThrow('Application error');
    });
  });
});
