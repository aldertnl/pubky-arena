import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TagsOfInterestHeader } from './TagsOfInterestHeader';

describe('TagsOfInterestHeader', () => {
  it('renders the title with the brand-highlighted word', () => {
    render(<TagsOfInterestHeader />);

    expect(screen.getByRole('heading', { name: 'Tags of interest.' })).toBeInTheDocument();
    expect(screen.getByText('interest.')).toHaveClass('text-brand');
  });

  it('renders the subtitle', () => {
    render(<TagsOfInterestHeader />);

    expect(screen.getByText('Select topics to get suggestions on who to follow.')).toBeInTheDocument();
  });
});

describe('TagsOfInterestHeader - Snapshots', () => {
  it('matches snapshot', () => {
    const { container } = render(<TagsOfInterestHeader />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
