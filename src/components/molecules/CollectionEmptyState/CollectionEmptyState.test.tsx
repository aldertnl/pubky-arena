import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CollectionEmptyState } from './CollectionEmptyState';

describe('CollectionEmptyState', () => {
  it('renders the shared empty-collection message', () => {
    render(<CollectionEmptyState />);

    expect(screen.getByText('This collection is empty.')).toBeInTheDocument();
  });

  it('exposes the collection-items-empty test id used as the feed empty state', () => {
    render(<CollectionEmptyState />);

    expect(screen.getByTestId('collection-items-empty')).toBeInTheDocument();
  });
});

describe('CollectionEmptyState - Snapshots', () => {
  it('matches the snapshot', () => {
    const { container } = render(<CollectionEmptyState />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
