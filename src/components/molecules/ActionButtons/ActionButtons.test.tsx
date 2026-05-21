import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionButtons } from './ActionButtons';

describe('ActionButtons', () => {
  it('renders all buttons with default text', () => {
    render(<ActionButtons />);

    const learnButton = screen.getByRole('button', { name: /learn/i });
    const createAccountButton = screen.getByRole('button', { name: /join now/i });

    expect(learnButton).toBeInTheDocument();
    expect(createAccountButton).toBeInTheDocument();

    // Check icons are present
    expect(document.querySelector('.lucide-book-open')).toBeInTheDocument();
    expect(document.querySelector('.lucide-user-round-plus')).toBeInTheDocument();
  });

  it('calls onLearn when learn button is clicked', () => {
    const mockOnLearn = vi.fn();
    render(<ActionButtons onLearn={mockOnLearn} />);

    const learnButton = screen.getByRole('button', { name: /learn/i });
    fireEvent.click(learnButton);

    expect(mockOnLearn).toHaveBeenCalledTimes(1);
  });

  it('calls onCreateAccount when create account button is clicked', () => {
    const mockOnCreateAccount = vi.fn();
    render(<ActionButtons onCreateAccount={mockOnCreateAccount} />);

    const createAccountButton = screen.getByRole('button', { name: /join now/i });
    fireEvent.click(createAccountButton);

    expect(mockOnCreateAccount).toHaveBeenCalledTimes(1);
  });

  it('handles callbacks simultaneously', () => {
    const mockOnLearn = vi.fn();
    const mockOnCreateAccount = vi.fn();

    render(<ActionButtons onLearn={mockOnLearn} onCreateAccount={mockOnCreateAccount} />);

    const learnButton = screen.getByRole('button', { name: /learn/i });
    const createAccountButton = screen.getByRole('button', { name: /join now/i });

    fireEvent.click(learnButton);
    fireEvent.click(createAccountButton);

    expect(mockOnLearn).toHaveBeenCalledTimes(1);
    expect(mockOnCreateAccount).toHaveBeenCalledTimes(1);
  });
});

describe('ActionButtons - Snapshots', () => {
  it('matches snapshot with default props', () => {
    const { container } = render(<ActionButtons />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with custom text', () => {
    const { container } = render(<ActionButtons learnText="Read" createAccountText="Register" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with custom className', () => {
    const { container } = render(<ActionButtons className="custom-action-buttons" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with all callbacks', () => {
    const mockOnLearn = vi.fn();
    const mockOnCreateAccount = vi.fn();

    const { container } = render(<ActionButtons onLearn={mockOnLearn} onCreateAccount={mockOnCreateAccount} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with learn callback only', () => {
    const mockOnLearn = vi.fn();

    const { container } = render(<ActionButtons onLearn={mockOnLearn} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with create account callback only', () => {
    const mockOnCreateAccount = vi.fn();

    const { container } = render(<ActionButtons onCreateAccount={mockOnCreateAccount} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
