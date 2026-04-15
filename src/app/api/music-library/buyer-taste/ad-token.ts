import { createHmac } from 'crypto';

export function generateAdId(pubky: string, secret: string): string {
  return createHmac('sha256', secret).update(pubky).digest('hex');
}

export function resolveAdId(adId: string, pubkyList: string[], secret: string): string | null {
  return pubkyList.find((pubky) => generateAdId(pubky, secret) === adId) ?? null;
}
