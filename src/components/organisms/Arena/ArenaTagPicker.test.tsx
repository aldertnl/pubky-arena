import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArenaTagPicker } from './ArenaTagPicker';

const topics = ['pubky', 'bitcoin', 'music', 'art', 'design', 'news', 'code', 'books', 'games', 'science', 'extra'].map(
  (label, index) => ({ label, tagged_count: 100 - index, taggers_count: 1, taggers_id: [] }),
);
const pickerProps = { topic: 'pubky', topics, timeframeLabel: 'This month' };

describe('Arena tag picker', () => {
  it('places lowercase all under SELECT ALL TOPICS above the existing tags', () => {
    const onTopic = vi.fn();
    const { rerender } = render(<ArenaTagPicker {...pickerProps} onTopic={onTopic} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose topic tag' }));
    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      'SELECT ALL TOPICS',
      'TOP #10 TOPICS This month',
    ]);
    const all = screen.getByRole('button', { name: 'all' });
    expect(all).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(all);
    expect(onTopic).toHaveBeenCalledWith(null);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    rerender(<ArenaTagPicker {...pickerProps} topic={null} onTopic={onTopic} />);
    expect(screen.getByRole('button', { name: 'Choose topic tag' })).toHaveTextContent('all');
    fireEvent.click(screen.getByRole('button', { name: 'Choose topic tag' }));
    expect(screen.getByRole('button', { name: 'all' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'pubky tag (100 posts)' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'pubky tag (100 posts)' }));
    expect(onTopic).toHaveBeenLastCalledWith('pubky');
  });

  it('keeps a literal custom tag named all distinct from the All setting', async () => {
    const onTopic = vi.fn();
    render(<ArenaTagPicker {...pickerProps} onTopic={onTopic} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose topic tag' }));
    const input = screen.getByRole('textbox', { name: 'Topic tag' });
    fireEvent.change(input, { target: { value: 'all' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(onTopic).toHaveBeenCalledWith('all'));
  });

  it('opens the tag control and applies a normalized custom topic', async () => {
    const onTopic = vi.fn();
    const user = userEvent.setup();
    render(<ArenaTagPicker {...pickerProps} onTopic={onTopic} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Choose topic tag' }));
    const input = screen.getByRole('textbox', { name: 'Topic tag' });
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('placeholder', 'enter topic');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Set tag' })).not.toBeInTheDocument();
    await user.type(input, '  New-topic  {Enter}');
    await waitFor(() => expect(onTopic).toHaveBeenCalledWith('new-topic'));
    expect(screen.queryByRole('textbox', { name: 'Topic tag' })).not.toBeInTheDocument();
  });

  it('rejects invalid tags without changing the current topic', async () => {
    const onTopic = vi.fn();
    render(<ArenaTagPicker {...pickerProps} onTopic={onTopic} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose topic tag' }));
    const input = screen.getByRole('textbox', { name: 'Topic tag' });
    fireEvent.change(input, { target: { value: 'one:two' } });
    fireEvent.submit(input.closest('form')!);
    await screen.findByRole('alert');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(onTopic).not.toHaveBeenCalled();
  });

  it('shows the first ten topics for the selected timeframe and selects a tag directly', () => {
    const onTopic = vi.fn();
    const { rerender } = render(<ArenaTagPicker {...pickerProps} onTopic={onTopic} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose topic tag' }));
    expect(screen.getByRole('heading', { name: 'TOP #10 TOPICS This month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'pubky tag (100 posts)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: 'extra tag (90 posts)' })).not.toBeInTheDocument();
    rerender(<ArenaTagPicker {...pickerProps} timeframeLabel="All time" onTopic={onTopic} />);
    expect(screen.getByRole('heading', { name: 'TOP #10 TOPICS All time' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'bitcoin tag (99 posts)' }));
    expect(onTopic).toHaveBeenCalledWith('bitcoin');
    expect(screen.queryByRole('textbox', { name: 'Topic tag' })).not.toBeInTheDocument();
  });
});
