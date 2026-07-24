import { redirect } from 'next/navigation';
import { SETTINGS_ROUTES } from '@/app/routes';

/** Keep old bookmarks functional without exposing language selection controls. */
export default function LegacyLanguageSettingsPage() {
  redirect(SETTINGS_ROUTES.ACCOUNT);
}
