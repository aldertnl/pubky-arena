import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

// Import English messages for i18n mock
import enMessages from '../../messages/en.json';

// =============================================================================
// Mocks (no process.env — env vars are injected via vitest config `define`)
// =============================================================================

/**
 * Get a nested value from an object using a dot-separated key path.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function createTranslationFunction(namespace: string) {
  const t = (key: string, params?: Record<string, string | number>): string => {
    const fullPath = namespace ? `${namespace}.${key}` : key;
    const value = getNestedValue(enMessages as Record<string, unknown>, fullPath);
    if (typeof value === 'string') {
      if (params) {
        return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
          return str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
        }, value);
      }
      return value;
    }
    return key;
  };

  t.raw = (key: string): unknown => {
    const fullPath = namespace ? `${namespace}.${key}` : key;
    return getNestedValue(enMessages as Record<string, unknown>, fullPath) ?? key;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (t as any).rich = t;
  t.markup = t;

  return t;
}

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => createTranslationFunction(namespace ?? ''),
  useLocale: () => 'en',
  useMessages: () => enMessages,
  useTimeZone: () => 'UTC',
  useNow: () => new Date(),
  useFormatter: () => ({
    dateTime: (date: Date) => date.toISOString(),
    number: (num: number) => String(num),
    relativeTime: () => 'now',
  }),
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Next.js font imports
vi.mock('next/font/google', () => ({
  Inter_Tight: vi.fn(() => ({
    variable: '--font-geist-sans',
    className: 'inter-tight',
  })),
}));
