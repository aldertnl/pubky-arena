export interface GenerateDeeplinkOptions {
  encode?: boolean;
}

export const generatePubkyRingDeeplink = (value: string, options: GenerateDeeplinkOptions = {}): string => {
  const { encode = true } = options;
  const payload = encode ? encodeURIComponent(value) : value;
  return `pubkyring://${payload}`;
};

const PUBKYAUTH_PREFIX = 'pubkyauth://';

/**
 * Converts a `pubkyauth://signin?...` or `pubkyauth://signup?...` authorization URL into a
 * deeplink targeting Pubky Ring exclusively (`pubkyring://signin?...` / `pubkyring://signup?...`),
 * since other apps (e.g. Bitkit) also register the generic `pubkyauth` scheme.
 *
 * The scheme is replaced, not prefixed: a nested `pubkyring://pubkyauth://...` URL gets the inner
 * colon stripped by Android URI normalization into a form Pubky Ring cannot parse (see #748).
 */
export const generatePubkyRingAuthDeeplink = (authUrl: string): string => {
  if (!authUrl.startsWith(PUBKYAUTH_PREFIX)) return authUrl;
  return `pubkyring://${authUrl.slice(PUBKYAUTH_PREFIX.length)}`;
};
