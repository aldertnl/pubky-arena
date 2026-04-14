import type {
  TCreateLnVerificationResult,
  TAwaitLnVerificationResult,
  TVerifySmsCodeParams,
  TVerifySmsCodeResult,
  TSendSmsCodeResult,
  TSmsInfoResult,
  TLnInfoResult,
  TInviteCodeResult,
} from '@/core/services/homegate';

export type THomegateCreateLnVerificationResult = TCreateLnVerificationResult;
export type THomegateAwaitLnVerificationResult = TAwaitLnVerificationResult;
export type THomegateVerifySmsCodeParams = TVerifySmsCodeParams;
export type THomegateVerifySmsCodeResult = TVerifySmsCodeResult;
export type THomegateSendSmsCodeResult = TSendSmsCodeResult;
export type THomegateSmsInfoResult = TSmsInfoResult;
export type THomegateLnInfoResult = TLnInfoResult;
export type THomegateInviteCodeResult = TInviteCodeResult;
