import { TimelineLoadingMore } from './TimelineLoadingMore';
import { TimelineError } from './TimelineError';
import { TimelineEndMessage } from './TimelineEndMessage';

export interface TimelineListFooterContext {
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  itemCount: number;
}

export function TimelineListFooter({ context }: { context?: TimelineListFooterContext }) {
  if (!context) return null;
  const { loadingMore, error, hasMore, itemCount } = context;
  return (
    <>
      {loadingMore && <TimelineLoadingMore />}
      {error && itemCount > 0 && <TimelineError message={error} />}
      {!hasMore && !loadingMore && itemCount > 0 && <TimelineEndMessage />}
    </>
  );
}
