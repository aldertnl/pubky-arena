import { describe, expect, it } from 'vitest';
import { routing } from './routing';

describe('i18n routing', () => {
  it('supports English as the only application locale', () => {
    expect(routing.locales).toEqual(['en']);
    expect(routing.defaultLocale).toBe('en');
  });
});
