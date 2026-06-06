import { PostController } from '@/controllers/post/post';
import { Logger } from '@/libs/logger/logger';
import type { PostHomeserverVerificationStatus } from './usePostHomeserverVerification.types';

type VerificationEntry = {
  status: PostHomeserverVerificationStatus;
  inflight: Promise<void> | null;
  listeners: Set<() => void>;
};

const entries = new Map<string, VerificationEntry>();

function getEntry(compositeId: string): VerificationEntry {
  let entry = entries.get(compositeId);
  if (!entry) {
    entry = { status: 'idle', inflight: null, listeners: new Set() };
    entries.set(compositeId, entry);
  }
  return entry;
}

function notify(compositeId: string) {
  getEntry(compositeId).listeners.forEach((listener) => listener());
}

export function getPostHomeserverVerificationSnapshot(compositeId: string): PostHomeserverVerificationStatus {
  return getEntry(compositeId).status;
}

export function subscribePostHomeserverVerification(compositeId: string, listener: () => void): () => void {
  const entry = getEntry(compositeId);
  entry.listeners.add(listener);
  return () => entry.listeners.delete(listener);
}

/** Clears coordinator state (for tests). */
export function clearPostHomeserverVerificationCoordinator(): void {
  entries.clear();
}

function startVerification(compositeId: string, entry: VerificationEntry): Promise<void> {
  entry.status = 'checking';
  notify(compositeId);

  return (async () => {
    try {
      const { verified } = await PostController.fetchHomeserverVerification({ compositeId });
      entry.status = verified ? 'verified' : 'not_found';
    } catch (error) {
      Logger.error('[postHomeserverVerificationCoordinator] Verification failed', { compositeId, error });
      entry.status = 'error';
    } finally {
      entry.inflight = null;
      notify(compositeId);
    }
  })();
}

export async function runPostHomeserverVerification(compositeId: string): Promise<void> {
  const entry = getEntry(compositeId);
  if (entry.status === 'verified') return;

  entry.inflight ??= startVerification(compositeId, entry);
  await entry.inflight;
}
