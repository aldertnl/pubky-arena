'use client';

import { type RefObject, useEffect, useState } from 'react';
import styles from './Arena.module.css';

interface ConnectorAnchor {
  left: number;
  right: number;
  y: number;
}

/** Route through the space between columns, or the left gutter when stacked. */
function getConversationConnectorPath(source: ConnectorAnchor, target: ConnectorAnchor) {
  const sideBySide = target.left > source.right;
  const start = sideBySide ? source.right : source.left;
  const lane = sideBySide ? (source.right + target.left) / 2 : Math.min(source.left, target.left) - 12;
  const direction = target.y >= source.y ? 1 : -1;
  const radius = Math.min(10, Math.abs(target.y - source.y) / 2, Math.abs(lane - start));
  if (sideBySide && Math.abs(target.y - source.y) < 1) return `M ${start} ${source.y} H ${target.left}`;
  const approach = sideBySide ? -radius : radius;
  return [
    `M ${start} ${source.y} H ${lane + approach}`,
    `Q ${lane} ${source.y} ${lane} ${source.y + direction * radius}`,
    `V ${target.y - direction * radius}`,
    `Q ${lane} ${target.y} ${lane + radius} ${target.y}`,
    `H ${target.left}`,
  ].join(' ');
}

type ElementRef = RefObject<HTMLDivElement | null>;

export function ArenaConversationConnectors({
  readerRef,
  originalRef,
  replyRef,
  composerRef,
}: {
  readerRef: ElementRef;
  originalRef: ElementRef;
  replyRef: ElementRef;
  composerRef: ElementRef;
}) {
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const origin = reader.getBoundingClientRect();
      const anchor = (element: HTMLDivElement | null): ConnectorAnchor | null => {
        if (!element) return null;
        const avatar = element.querySelector<HTMLElement>(
          'a[href^="/profile"], [data-testid="quick-reply-fallback-avatar"]',
        );
        if (!avatar) return null;
        const avatarBox = avatar.getBoundingClientRect();
        const cardBox = (element.querySelector('[data-slot="card"]') ?? element).getBoundingClientRect();
        if (!avatarBox.height || !cardBox.width) return null;
        return {
          left: cardBox.left - origin.left,
          right: cardBox.right - origin.left,
          y: avatarBox.top + avatarBox.height / 2 - origin.top,
        };
      };
      const source = anchor(originalRef.current);
      const next = source
        ? [anchor(replyRef.current), anchor(composerRef.current)]
            .filter((target): target is ConnectorAnchor => target !== null)
            .map((target) => getConversationConnectorPath(source, target))
        : [];
      setPaths((previous) => (previous.join('|') === next.join('|') ? previous : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(schedule);
    [reader, originalRef.current, replyRef.current, composerRef.current].forEach((element) => {
      if (element) resize.observe(element);
    });
    // Native post headers may resolve after the card shell, without changing its size.
    const content = new MutationObserver(schedule);
    content.observe(reader, { childList: true, subtree: true });
    reader.addEventListener('animationend', schedule);
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      content.disconnect();
      reader.removeEventListener('animationend', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [readerRef, originalRef, replyRef, composerRef]);

  return (
    <svg className={styles.readerConnectors} aria-hidden="true" data-testid="arena-conversation-connectors">
      {paths.map((path, index) => (
        <path key={index} d={path} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      ))}
    </svg>
  );
}
