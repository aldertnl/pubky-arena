import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';

import { Tag } from './Tag';

const meta: Meta<typeof Tag> = {
  title: 'Atoms/Tag',
  component: Tag,
  tags: ['autodocs', 'hot-tags-truncate'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Tag pill with ellipsis truncation for long names.',
      },
    },
  },
  args: {
    name: 'aaaaabbbbbcccccddddd',
    count: 16,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function getTagNameEl(canvasElement: HTMLElement, itemIndex: number): HTMLElement {
  const el = canvasElement.querySelector(
    `[data-testid="tag-item-${itemIndex}"] [data-testid="tag-name"]`,
  ) as HTMLElement | null;
  if (!el) throw new Error('tag-name element not found');
  return el;
}

function TagList({ args }: { args: React.ComponentProps<typeof Tag> }) {
  return (
    <div className="flex flex-col gap-2">
      <div data-testid="tag-item-0">
        <Tag {...args} />
      </div>
      <div data-testid="tag-item-1">
        <Tag name="synonym" count={42} />
      </div>
      <div data-testid="tag-item-2">
        <Tag name="bitkit" count={7} />
      </div>
    </div>
  );
}

export const NoTruncateAt360px: Story = {
  render: (args) => (
    <div style={{ width: '360px' }}>
      <TagList args={args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByTestId('tag-item-0')).toBeInTheDocument());

    const tagName = getTagNameEl(canvasElement, 0);
    const style = getComputedStyle(tagName);
    expect(style.textOverflow).toBe('ellipsis');
    expect(style.overflow).toBe('hidden');
    expect(style.whiteSpace).toBe('nowrap');
    expect(tagName.scrollWidth).toBeLessThanOrEqual(tagName.clientWidth);
  },
};

export const TruncateAt180px: Story = {
  render: (args) => (
    <div style={{ width: '180px' }}>
      <TagList args={args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByTestId('tag-item-0')).toBeInTheDocument());

    const tagName = getTagNameEl(canvasElement, 0);
    const style = getComputedStyle(tagName);
    expect(style.textOverflow).toBe('ellipsis');
    expect(style.overflow).toBe('hidden');
    expect(style.whiteSpace).toBe('nowrap');
    // Ensures the content actually overflows its container (required for ellipsis truncation to visually occur).
    // Note: This is intentionally verified in a real browser (Storybook play/Playwright). In Vitest+jsdom,
    // layout metrics like clientWidth/scrollWidth are often 0 or unreliable, making ellipsis assertions flaky.
    expect(tagName.scrollWidth).toBeGreaterThan(tagName.clientWidth);
  },
};
