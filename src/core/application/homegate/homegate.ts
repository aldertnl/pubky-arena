import { baseUriBuilder } from 'pubky-app-specs';
import * as Core from '@/core';
import { HttpMethod } from '@/libs';
import type * as Types from './homegate.types';

/**
 * Homegate application service.
 *
 * Orchestrates homegate workflows:
 * - Lightning Network verification price retrieval
 * - SMS verification
 * - Payment verification
 *
 * This layer is called by the controller and handles business logic orchestration.
 */
export class HomegateApplication {
  private constructor() {}

  /**
   * Get SMS verification availability info.
   *
   * @returns The availability status
   * @throws AppError if retrieval fails
   */
  static async getSmsVerificationInfo(): Promise<Types.THomegateSmsInfoResult> {
    return await Core.HomegateService.getSmsVerificationInfo();
  }

  /**
   * Get Lightning Network verification availability and price.
   *
   * @returns The availability status and price if available
   * @throws AppError if retrieval fails
   */
  static async getLnVerificationInfo(): Promise<Types.THomegateLnInfoResult> {
    return await Core.HomegateService.getLnVerificationInfo();
  }

  /**
   * Create a new Lightning Network verification request.
   *
   * @returns The verification details including the BOLT11 invoice
   * @throws AppError if creation fails
   */
  static async createLnVerification(): Promise<Types.THomegateCreateLnVerificationResult> {
    return Core.HomegateService.createLnVerification();
  }

  /**
   * Await Lightning Network payment confirmation.
   * Long-polling endpoint that waits for payment to be confirmed.
   *
   * @param verificationId - The verification ID from createLnVerification
   * @param signal - Optional abort signal for canceling an in-flight long-poll request
   * @returns The verification result
   * @throws AppError if awaiting fails
   */
  static async awaitLnVerification(
    verificationId: string,
    signal?: AbortSignal,
  ): Promise<Types.THomegateAwaitLnVerificationResult> {
    if (signal) {
      return Core.HomegateService.awaitLnVerification(verificationId, signal);
    }
    return Core.HomegateService.awaitLnVerification(verificationId);
  }

  /**
   * Verify an SMS code for a given phone number.
   *
   * @param params.phoneNumber - The phone number to verify
   * @param params.code - The SMS code to verify
   * @returns The verification result with signup code if valid
   * @throws AppError if verification fails
   */
  static async verifySmsCode({
    phoneNumber,
    code,
  }: Types.THomegateVerifySmsCodeParams): Promise<Types.THomegateVerifySmsCodeResult> {
    return Core.HomegateService.verifySmsCode({ phoneNumber, code });
  }

  /**
   * Send an SMS verification code to a phone number.
   *
   * @param phoneNumber - The phone number to send the code to
   * @returns The result of the SMS send request
   * @throws AppError if sending fails
   */
  static async sendSmsCode(phoneNumber: string): Promise<Types.THomegateSendSmsCodeResult> {
    return Core.HomegateService.sendSmsCode(phoneNumber);
  }

  /**
   * Get the current BTC/USD and SAT/USD exchange rate.
   *
   * @returns The BTC rate with satUsd, btcUsd, and lastUpdatedAt
   * @throws AppError if retrieval fails
   */
  static async getBtcRate(): Promise<Core.BtcRate> {
    return Core.ExchangerateService.getSatoshiUsdRate();
  }

  /**
   * Converts a Uint8Array or ArrayBuffer to a hex string.
   */
  private static toHex(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generates a cryptographic proof for Homegate authentication.
   * Creates a random preimage, hashes it with SHA-256, and writes the hash
   * to the user's homeserver at /pub/pubky.app/homegate/proof.
   *
   * @param pubky - The user's z32 public key
   * @returns The hex-encoded preimage to send to Homegate
   */
  private static async generateAndWriteProof(pubky: string): Promise<string> {
    // Generate 32 random bytes as the preimage
    const preimage = new Uint8Array(32);
    crypto.getRandomValues(preimage);

    // SHA-256 hash the preimage
    const hashBuffer = await crypto.subtle.digest('SHA-256', preimage);
    const hashHex = this.toHex(hashBuffer);

    // Write the hash to the user's homeserver
    const proofUrl = `${baseUriBuilder(pubky)}homegate/proof`;
    await Core.HomeserverService.request({
      method: HttpMethod.PUT,
      url: proofUrl,
      bodyJson: { hash: hashHex },
    });

    return this.toHex(preimage);
  }

  /**
   * Generate an invite code for the authenticated user.
   *
   * Orchestrates the full proof-of-ownership flow:
   * 1. Generates a random preimage and its SHA-256 hash
   * 2. Writes the hash proof to the user's homeserver
   * 3. Sends the preimage to Homegate to request an invite code
   *
   * @param pubky - The user's z32 public key
   * @returns The invite code result containing the signupCode
   * @throws AppError if proof generation, homeserver write, or API call fails
   */
  static async generateInviteCode(pubky: string): Promise<Types.THomegateInviteCodeResult> {
    const preimageHex = await this.generateAndWriteProof(pubky);

    return Core.HomegateService.requestInviteCode({
      pubky,
      hashProofPreimage: preimageHex,
    });
  }
}
