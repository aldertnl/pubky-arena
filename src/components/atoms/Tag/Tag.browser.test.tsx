import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { Tag } from './Tag';

import '../../../app/globals.css';

describe('Tag - Visual Regression', () => {
  it('does not truncate at 360px width', async () => {
    render(
      <div style={{ width: '360px' }}>
        <Tag name="aaaaabbbbbcccccddddd" count={16} />
      </div>,
    );

    const tagName = page.getByTestId('tag-name');
    await expect.element(tagName).toBeVisible();

    const el = tagName.element() as HTMLElement;
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth);
  });

  it('truncates at 180px width', async () => {
    render(
      <div style={{ width: '180px' }}>
        <Tag name="aaaaabbbbbcccccddddd" count={16} />
      </div>,
    );

    const tagName = page.getByTestId('tag-name');
    await expect.element(tagName).toBeVisible();

    const el = tagName.element() as HTMLElement;
    expect(el.scrollWidth).toBeGreaterThan(el.clientWidth);
  });

  it('screenshot: tag at 360px', async () => {
    render(
      <div style={{ width: '360px' }}>
        <Tag name="aaaaabbbbbcccccddddd" count={16} />
      </div>,
    );

    const tagEl = page.getByTestId('tag');
    await expect.element(tagEl).toBeVisible();
    await expect(tagEl).toMatchScreenshot('tag-360px');
  });

  it('screenshot: tag at 180px (truncated)', async () => {
    render(
      <div style={{ width: '180px' }}>
        <Tag name="aaaaabbbbbcccccddddd" count={16} />
      </div>,
    );

    const tagEl = page.getByTestId('tag');
    await expect.element(tagEl).toBeVisible();
    await expect(tagEl).toMatchScreenshot('tag-180px-truncated');
  });
});
