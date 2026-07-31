import { render, screen } from '@testing-library/react';
import { Library } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { DynamicLucideIcon } from './DynamicLucideIcon';

describe('DynamicLucideIcon', () => {
  it('renders a valid dynamic icon', async () => {
    render(<DynamicLucideIcon name="mountain" data-testid="dynamic-icon" />);

    expect(await screen.findByTestId('dynamic-icon')).toBeInTheDocument();
  });

  it('renders the default fallback for a missing icon', () => {
    render(<DynamicLucideIcon data-testid="fallback-icon" />);

    expect(screen.getByTestId('fallback-icon')).toHaveClass('lucide-activity');
  });

  it('renders a consumer-provided fallback for an invalid icon', () => {
    render(
      <DynamicLucideIcon
        name="not-a-real-lucide-icon"
        fallback={Library}
        data-testid="fallback-icon"
        className="size-6"
      />,
    );

    expect(screen.getByTestId('fallback-icon')).toHaveClass('lucide-library');
    expect(screen.getByTestId('fallback-icon')).toHaveClass('size-6');
  });

  it('can omit the fallback while a consumer handles its own loading state', () => {
    const { container } = render(<DynamicLucideIcon name="not-a-real-lucide-icon" fallback={null} />);

    expect(container.firstChild).toBeNull();
  });
});

describe('DynamicLucideIcon - Snapshots', () => {
  it('matches snapshot for a consumer-provided fallback', () => {
    const { container } = render(<DynamicLucideIcon name={null} fallback={Library} className="size-6" />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
