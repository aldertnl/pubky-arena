import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Hot } from './Hot';

vi.mock('@/organisms/Arena/Arena', () => ({ Arena: () => <div>Arena content</div> }));
vi.mock('@/organisms/ContentLayout/ContentLayout', () => ({
  ContentLayout: ({
    children,
    showLeftSidebar,
    showRightSidebar,
  }: {
    children: React.ReactNode;
    showLeftSidebar: boolean;
    showRightSidebar: boolean;
  }) => (
    <main data-left-sidebar={showLeftSidebar} data-right-sidebar={showRightSidebar}>
      {children}
    </main>
  ),
}));

describe('Hot', () => {
  it('places Arena in a full-width native shell without the old sidebars', () => {
    render(<Hot />);
    expect(screen.getByText('Arena content')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('data-left-sidebar', 'false');
    expect(screen.getByRole('main')).toHaveAttribute('data-right-sidebar', 'false');
  });
});
