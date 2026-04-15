import { describe, expect, it } from 'vitest';

import type { NexusFileUrls } from '@/core/services/nexus/nexus.types';

import { parseNexusFileUrlsField } from './nexusFileUrls';

describe('parseNexusFileUrlsField', () => {
  it('returns object urls unchanged', () => {
    const u: NexusFileUrls = { feed: 'a', main: 'b', small: 'c' };
    expect(parseNexusFileUrlsField(u)).toEqual(u);
  });

  it('parses JSON string', () => {
    const s = '{"feed":"https://f","main":"https://m","small":"https://s"}';
    expect(parseNexusFileUrlsField(s).main).toBe('https://m');
  });

  it('returns empty slots on invalid JSON', () => {
    const out = parseNexusFileUrlsField('not-json');
    expect(out).toEqual({ feed: '', main: '', small: '' });
  });
});
