import { describe, it, expect } from 'vitest';
import { truncateReposterName, getFirstReposterName } from './GroupedRepostHeader.utils';

describe('truncateReposterName', () => {
  it('returns empty string for empty input', () => {
    expect(truncateReposterName('', 5)).toBe('');
  });

  it('returns full string when length <= maxLength', () => {
    expect(truncateReposterName('Alice', 5)).toBe('Alice');
    expect(truncateReposterName('Al', 5)).toBe('Al');
  });

  it('truncates with ellipsis when maxLength >= 4', () => {
    expect(truncateReposterName('AliceWithLongName', 5)).toBe('Al...');
    expect(truncateReposterName('Pablosa', 5)).toBe('Pa...');
    expect(truncateReposterName('VeryLongUsername', 15)).toBe('VeryLongUser...');
  });

  it('returns str.slice(0, maxLength) without ellipsis when maxLength < 4', () => {
    expect(truncateReposterName('Alice', 3)).toBe('Ali');
    expect(truncateReposterName('Alice', 2)).toBe('Al');
    expect(truncateReposterName('Alice', 1)).toBe('A');
  });
});

describe('getFirstReposterName', () => {
  const baseParams = {
    includesCurrentUser: false,
    isFirstReposterLoading: false,
    firstReposterProfile: null,
    firstReposterId: 'user1',
    youLabel: 'You',
  };

  it('returns youLabel when includesCurrentUser', () => {
    expect(
      getFirstReposterName({
        ...baseParams,
        includesCurrentUser: true,
      }),
    ).toBe('You');
  });

  it('returns loading placeholder when isFirstReposterLoading', () => {
    expect(
      getFirstReposterName({
        ...baseParams,
        isFirstReposterLoading: true,
      }),
    ).toBe('...');
  });

  it('returns profile name when available', () => {
    expect(
      getFirstReposterName({
        ...baseParams,
        firstReposterProfile: { name: 'Alice' },
      }),
    ).toBe('Alice');
  });

  it('returns formatted pubky when no profile name', () => {
    expect(
      getFirstReposterName({
        ...baseParams,
      }),
    ).toBe('user1');
  });
});
