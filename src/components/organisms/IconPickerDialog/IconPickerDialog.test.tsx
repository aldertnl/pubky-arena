import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LUCIDE_ICON_NAMES } from '@/libs/utils/lucideIcons';
import { IconPickerDialog } from './IconPickerDialog';

const TEST_ICONS = ['activity', 'airplay', 'mountain'] as const;

describe('IconPickerDialog', () => {
  it('renders a searchable icon grid with visible SVGs when open', async () => {
    render(<IconPickerDialog open onSelect={() => {}} icons={TEST_ICONS} />);

    expect(screen.getByRole('searchbox', { name: 'Search for icon' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'activity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'airplay' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'mountain' })).toBeInTheDocument();
    expect(screen.getByTestId('icon-picker-dialog-content')).toHaveClass('flex-col', 'gap-6');
    expect(screen.getByTestId('icon-picker-dialog-content')).toHaveClass('h-110');
    expect(screen.getByRole('searchbox', { name: 'Search for icon' })).toHaveClass('border-dashed');
    expect(screen.getByRole('searchbox', { name: 'Search for icon' })).toHaveClass('rounded-md');
    expect(screen.getByRole('searchbox', { name: 'Search for icon' })).not.toHaveClass('mt-6');
    expect(screen.getByTestId('icon-picker-scroll-area')).not.toHaveClass('mt-6');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'activity' }).querySelector('svg')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'airplay' }).querySelector('svg')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'mountain' }).querySelector('svg')).toBeInTheDocument();
    });
  });

  it('filters icons by their kebab-case names', () => {
    render(<IconPickerDialog open onSelect={() => {}} icons={TEST_ICONS} />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search for icon' }), {
      target: { value: 'mount' },
    });

    expect(screen.getByRole('button', { name: 'mountain' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'activity' })).not.toBeInTheDocument();
  });

  it('normalizes spaces in search queries', () => {
    render(<IconPickerDialog open onSelect={() => {}} icons={['circle-alert', 'activity']} />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search for icon' }), {
      target: { value: 'circle alert' },
    });

    expect(screen.getByRole('button', { name: 'circle alert' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'activity' })).not.toBeInTheDocument();
  });

  it('returns the selected icon and closes the dialog', () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <IconPickerDialog open onOpenChange={onOpenChange} onSelect={onSelect} value="activity" icons={TEST_ICONS} />,
    );

    expect(screen.getByRole('button', { name: 'activity' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'mountain' }));

    expect(onSelect).toHaveBeenCalledWith('mountain');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('filters invalid names supplied by a consumer', () => {
    render(<IconPickerDialog open onSelect={() => {}} icons={['not-a-real-icon']} />);

    expect(screen.getByText('No icons found')).toBeInTheDocument();
  });

  it('loads the icon catalog in bounded batches while scrolling', () => {
    const icons = LUCIDE_ICON_NAMES.slice(0, 110);
    const initiallyHiddenIcon = icons[100];
    render(<IconPickerDialog open onSelect={() => {}} icons={icons} />);

    expect(screen.queryByTestId(`icon-picker-option-${initiallyHiddenIcon}`)).not.toBeInTheDocument();

    const scrollArea = screen.getByTestId('icon-picker-scroll-area');
    Object.defineProperties(scrollArea, {
      clientHeight: { configurable: true, value: 200 },
      scrollHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, value: 180 },
    });
    fireEvent.scroll(scrollArea);

    expect(screen.getByTestId(`icon-picker-option-${initiallyHiddenIcon}`)).toBeInTheDocument();
  });

  it('supports context-specific accessible copy', () => {
    render(
      <IconPickerDialog
        open
        onSelect={() => {}}
        icons={[]}
        title="Choose a collection icon"
        description="Choose a custom icon for your collection."
        searchPlaceholder="Search collection icons"
        emptyMessage="No collection icons found"
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Choose a collection icon' })).toBeInTheDocument();
    expect(screen.getByText('Choose a custom icon for your collection.')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search collection icons' })).toBeInTheDocument();
    expect(screen.getByText('No collection icons found')).toBeInTheDocument();
  });

  it('can manage its open state through a trigger', () => {
    render(
      <IconPickerDialog onSelect={() => {}} icons={TEST_ICONS}>
        <button type="button">Choose icon</button>
      </IconPickerDialog>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Choose icon' }));
    expect(screen.getByRole('dialog', { name: 'Choose icon' })).toBeInTheDocument();
  });

  it('stops selection clicks from reaching a clickable ancestor', () => {
    const ancestorClick = vi.fn();
    render(
      <div onClick={ancestorClick}>
        <IconPickerDialog open onSelect={() => {}} icons={TEST_ICONS} />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'activity' }));

    expect(ancestorClick).not.toHaveBeenCalled();
  });
});

describe('IconPickerDialog - Snapshots', () => {
  it('matches snapshot for the empty state', () => {
    const { baseElement } = render(<IconPickerDialog open onSelect={() => {}} icons={[]} />);

    expect(baseElement).toMatchSnapshot();
  });
});
