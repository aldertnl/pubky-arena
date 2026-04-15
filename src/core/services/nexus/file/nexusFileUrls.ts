import type { NexusFileUrls } from '@/core/services/nexus/nexus.types';

/**
 * Parses file `urls` when Nexus returns either a JSON string or an object.
 * (`NexusFileDetails.urls` is typed as {@link NexusFileUrls} only; wire payloads may still send a string.)
 * Safe for Open Graph paths: invalid JSON yields empty URL slots instead of throwing.
 */
export function parseNexusFileUrlsField(urls: NexusFileUrls | string): NexusFileUrls {
  if (typeof urls === 'string') {
    try {
      return JSON.parse(urls) as NexusFileUrls;
    } catch {
      return { feed: '', main: '', small: '' };
    }
  }
  return urls;
}
