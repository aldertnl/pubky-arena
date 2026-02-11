import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RepostText } from './RepostText';
import { NAME_TOKEN } from './RepostText.constants';

describe('RepostText', () => {
  it('renders with name in the middle of template', () => {
    render(<RepostText template={`${NAME_TOKEN} reposted`} name="John" />);
    expect(screen.getByTestId('repost-text-name')).toHaveTextContent('John');
  });

  it('renders prefix before name', () => {
    const { container } = render(<RepostText template={`By ${NAME_TOKEN} reposted`} name="John" />);
    expect(container.textContent).toBe('By John\u00A0reposted');
    expect(screen.getByTestId('repost-text-name')).toHaveTextContent('John');
  });

  it('renders suffix after name', () => {
    const { container } = render(<RepostText template={`${NAME_TOKEN} and others`} name="John" />);
    expect(container.textContent).toContain('and others');
  });

  it('trims leading whitespace from suffix and adds non-breaking space', () => {
    const { container } = render(<RepostText template={`${NAME_TOKEN}   and others`} name="John" />);
    expect(container.textContent).toBe('John\u00A0and others');
  });

  it('adds non-breaking space before non-comma suffix', () => {
    const { container } = render(<RepostText template={`${NAME_TOKEN} and others`} name="John" />);
    expect(container.textContent).toBe('John\u00A0and others');
  });

  it('handles comma suffix without non-breaking space', () => {
    const { container } = render(<RepostText template={`${NAME_TOKEN}, others reposted`} name="Jane" />);
    expect(container.textContent).toBe('Jane, others reposted');
  });

  it('renders name with shrink-0 class', () => {
    render(<RepostText template={`${NAME_TOKEN} reposted`} name="VeryLongUsername" />);
    const nameElement = screen.getByTestId('repost-text-name');
    expect(nameElement).toHaveClass('shrink-0');
  });
});

describe('RepostText - Snapshots', () => {
  it('matches snapshot for simple repost', () => {
    const { container } = render(<RepostText template={`${NAME_TOKEN} reposted`} name="Alice" />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for mobile format with comma', () => {
    const { container } = render(<RepostText template={`${NAME_TOKEN}, others reposted`} name="Bob" />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for desktop format with count', () => {
    const { container } = render(<RepostText template={`${NAME_TOKEN} and 3 others reposted this`} name="Charlie" />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with long name', () => {
    const { container } = render(<RepostText template={`${NAME_TOKEN} reposted`} name="VeryLongUsernameT..." />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with "You" as name', () => {
    const { container } = render(<RepostText template={`${NAME_TOKEN} and 2 others reposted this`} name="You" />);
    expect(container).toMatchSnapshot();
  });
});
