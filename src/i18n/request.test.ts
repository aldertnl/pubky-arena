import { describe, expect, it, vi } from 'vitest';
import enMessages from '../../messages/en.json';

type RequestConfigFactory = () => Promise<{ locale: string; messages: unknown }>;

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(() => ({ value: 'es' })),
  })),
  requestConfigFactory: undefined as RequestConfigFactory | undefined,
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

vi.mock('next-intl/server', () => ({
  getRequestConfig: (factory: RequestConfigFactory) => {
    mocks.requestConfigFactory = factory;
    return factory;
  },
}));

describe('i18n request config', () => {
  it('loads English without consulting a legacy locale cookie', async () => {
    await import('./request');

    expect(mocks.requestConfigFactory).toBeTypeOf('function');
    const config = await mocks.requestConfigFactory?.();

    expect(mocks.cookies).not.toHaveBeenCalled();
    expect(config).toEqual({
      locale: 'en',
      messages: enMessages,
    });
  });
});
