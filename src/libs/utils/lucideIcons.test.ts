import { describe, expect, it } from 'vitest';
import { isLucideIconName, LUCIDE_ICON_NAMES } from './lucideIcons';

describe('lucideIcons', () => {
  it('exposes the installed Lucide icon names', () => {
    expect(LUCIDE_ICON_NAMES).toContain('activity');
    expect(LUCIDE_ICON_NAMES).toContain('library');
  });

  it('recognizes valid Lucide icon names', () => {
    expect(isLucideIconName('activity')).toBe(true);
  });

  it('rejects missing and unknown icon names', () => {
    expect(isLucideIconName(undefined)).toBe(false);
    expect(isLucideIconName(null)).toBe(false);
    expect(isLucideIconName('not-a-real-lucide-icon')).toBe(false);
  });
});
