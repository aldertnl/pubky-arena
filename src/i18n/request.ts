import { getRequestConfig } from 'next-intl/server';
import enMessages from '../../messages/en.json';
import { routing } from './routing';

/**
 * i18n Request Configuration
 *
 * Configures next-intl with English messages for every request.
 * Legacy locale cookies are intentionally ignored.
 */
export default getRequestConfig(async () => ({
  locale: routing.defaultLocale,
  messages: enMessages,
}));
