import { useRef } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ArenaTagConnectors } from './ArenaTagConnectors';

const frames = new Map<number, FrameRequestCallback>();
let now = 0;
let frameId = 0;

function Harness() {
  const stageRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={stageRef}>
      <div>
        <div data-arena-selected-topic>Tag</div>
      </div>
      <ol data-arena-floor>
        <li>
          <div
            data-arena-post="a:1"
            style={{ width: '200px', height: '100px', borderRadius: '6px', transform: 'none' }}
          >
            Post
          </div>
        </li>
      </ol>
      <ArenaTagConnectors stageRef={stageRef} topic="pubky" />
    </div>
  );
}

async function advance(count = 25) {
  for (let i = 0; i < count; i++) {
    now += 16;
    await act(async () => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(now));
    });
  }
}

beforeEach(() => {
  now = 0;
  frames.clear();
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'DOMMatrixReadOnly',
    class {
      a = 1;
      b = 0;
      c = 0;
      d = 1;
    },
  );
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const isTag = this.hasAttribute('data-arena-selected-topic');
    const isCard = this.hasAttribute('data-arena-post');
    return new DOMRect(
      isCard ? 100 : 0,
      isCard ? 150 : 0,
      isTag ? 100 : isCard ? 200 : 600,
      isTag ? 32 : isCard ? 100 : 500,
    );
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Arena connector scheduling', () => {
  it('does no layout reads for opacity, highlight, decoration or its own SVG updates', async () => {
    const { container } = render(<Harness />);
    await advance();
    const card = container.querySelector<HTMLElement>('[data-arena-post]')!;
    const rect = vi.mocked(HTMLElement.prototype.getBoundingClientRect);
    rect.mockClear();
    await act(async () => {
      card.parentElement!.style.opacity = '0.55';
      card.parentElement!.setAttribute('data-arena-spotlight', 'true');
      card.classList.add('selected');
      container.querySelector('svg')!.style.color = 'red';
      card.append(document.createElement('span'));
    });
    await advance();
    expect(rect).not.toHaveBeenCalled();
    expect(container.querySelector('[data-arena-connection="a:1"]')).toHaveAttribute('data-spotlight');
    expect(container.querySelector('mask rect[fill="black"]')).toHaveAttribute('width', '200');
    expect(frames.size).toBe(0);
  });

  it('follows geometry changes briefly, stops when settled, and pauses offscreen', async () => {
    const { container } = render(<Harness />);
    await advance();
    const card = container.querySelector<HTMLElement>('[data-arena-post]')!;
    const stage = container.firstElementChild!;
    const rect = vi.mocked(HTMLElement.prototype.getBoundingClientRect);
    rect.mockClear();
    await act(async () => {
      card.style.setProperty('--arena-post-rotation', '3deg');
    });
    await advance();
    expect(rect).toHaveBeenCalled();
    expect(frames.size).toBe(0);
    rect.mockClear();
    await act(async () => {
      stage.setAttribute('data-arena-paused', '');
      card.style.setProperty('--arena-post-rotation', '5deg');
    });
    await advance();
    expect(rect).not.toHaveBeenCalled();
    await act(async () => {
      stage.removeAttribute('data-arena-paused');
    });
    await advance();
    expect(rect).toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });
});
