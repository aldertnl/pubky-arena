import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { RootContainer } from './ContainerRoot';

vi.mock('next/font/google', () => ({
  Inter_Tight: () => ({ variable: '--font-inter-tight' }),
}));

vi.mock('@/libs/runtime-config/runtime-config', () => ({
  getPlausibleDomain: () => undefined,
  getPlausibleScriptUrl: () => undefined,
  serializeRuntimeConfig: () => 'window.__PUBKY_CONFIG__ = {};',
}));

describe('RootContainer', () => {
  it('renders the document as English and left-to-right', () => {
    const html = renderToStaticMarkup(
      <RootContainer locale="en">
        <main>Content</main>
      </RootContainer>,
    );

    expect(html).toContain('<html lang="en" dir="ltr"');
  });
});

describe('RootContainer - Snapshots', () => {
  it('matches the English document snapshot', () => {
    const html = renderToStaticMarkup(
      <RootContainer locale="en">
        <main>Content</main>
      </RootContainer>,
    );

    expect(html).toMatchSnapshot();
  });
});
