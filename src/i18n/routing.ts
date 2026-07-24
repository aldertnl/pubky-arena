import { defineRouting } from 'next-intl/routing';

/**
 * i18n Routing Configuration
 *
 * Keeps next-intl routing in place while English is the only supported locale.
 * Locale prefixes stay out of URLs so additional locales can be restored later
 * without changing the current route structure.
 */
export const routing = defineRouting({
  locales: ['en'],
  defaultLocale: 'en',
  localePrefix: 'never',
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
