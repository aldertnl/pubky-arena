import { describe, expect, it, vi } from 'vitest';
import { SETTINGS_ROUTES } from '@/app/routes';
import SettingsLanguagePage from './page';

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

describe('legacy language settings page', () => {
  it('redirects to account settings', () => {
    SettingsLanguagePage();

    expect(mocks.redirect).toHaveBeenCalledWith(SETTINGS_ROUTES.ACCOUNT);
  });
});
