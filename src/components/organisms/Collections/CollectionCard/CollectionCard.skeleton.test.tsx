import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CollectionCardSkeleton } from './CollectionCard.skeleton';

describe('CollectionCardSkeleton', () => {
  it('renders the skeleton test id', () => {
    render(<CollectionCardSkeleton />);
    expect(document.querySelector('[data-testid="collection-card-skeleton"]')).toBeInTheDocument();
  });

  it('matches the snapshot', () => {
    const { container } = render(<CollectionCardSkeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
