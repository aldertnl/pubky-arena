import type { Session as LocksSdkSession } from '@pubky/locks-sdk';

/** Lock Server identity (pubky) the SDK client is bound to. */
export type TLocksServerParams = { lockServerPubky: string };

/** Params to build a `/connect` URL for the Lock-Server-hosted auth shell. */
export type TGenerateConnectUrlParams = TLocksServerParams & {
  /** Parent (pubky-app) origin; the Lock Server targets its postMessage + `frame-ancestors` at it. */
  returnTo: string;
  /** Opaque CSRF value echoed back in the callback for verification. */
  state: string;
};

/** Controller-facing params for the connect URL; `returnTo` is derived inside the controller. */
export type TGetConnectUrlParams = TLocksServerParams & {
  /** Opaque CSRF value echoed back in the callback for verification. */
  state: string;
};

/** Params to exchange a one-time callback code for a Locks session. */
export type TExchangeSessionCodeParams = TLocksServerParams & {
  code: string;
  state: string;
};

/** Params to restore a Locks session from a persisted bearer secret. */
export type TRestoreLocksSessionParams = TLocksServerParams & {
  /** The `exportSecret()` value persisted at login. */
  secret: string;
};

/**
 * Outcome of `exchangeSessionCode`. `session` is the live SDK object (needed for signout);
 * `secret` is the freshly minted bearer value to persist.
 */
export type TLocksSessionResult = {
  session: LocksSdkSession;
  /** Bearer secret to persist, then pass back to `restoreSession` on reload. */
  secret: string;
};
