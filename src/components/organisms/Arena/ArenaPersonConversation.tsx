'use client';

import { Button } from '@/atoms/Button/Button';
import { Skeleton } from '@/atoms/Skeleton/Skeleton';
import { useArenaPersonPost } from '@/hooks/useArenaPersonPost/useArenaPersonPost';
import { formatPublicKey } from '@/libs/utils/utils';
import { TIMEFRAME, type TimeframeType } from '@/stores/hot/hot.types';
import styles from './Arena.module.css';
import { ArenaConversation } from './ArenaConversation';

export function ArenaPersonConversation({
  author,
  authorName,
  postWindow,
}: {
  author: string;
  authorName?: string;
  postWindow: { timeframe: TimeframeType; now: number };
}) {
  const { post, loading, error, retry } = useArenaPersonPost(author, postWindow);
  if (loading)
    return (
      <div className={styles.dock} role="status" aria-label="Finding most popular post">
        <div className={styles.reader}>
          <Skeleton className="h-64 w-full rounded-md" />
          <Skeleton className="h-48 w-full rounded-md" />
        </div>
      </div>
    );
  if (error)
    return (
      <div className={styles.status} role="alert">
        Could not load this person’s most popular post.{' '}
        <Button variant="ghost" onClick={() => void retry()}>
          Retry post
        </Button>
      </div>
    );
  if (!post)
    return (
      <div className={styles.status} role="status">
        {postWindow.timeframe === TIMEFRAME.ALL_TIME
          ? 'This person has no posts yet.'
          : 'This person has no posts in this timeframe.'}
      </div>
    );
  return (
    <ArenaConversation
      key={post.id}
      rootId={post.id}
      selectedId={post.id}
      postWindow={postWindow}
      postLabel={`POPULAR POST BY ${authorName || formatPublicKey({ key: author })}`.toUpperCase()}
    />
  );
}
