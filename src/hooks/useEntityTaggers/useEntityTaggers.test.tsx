import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TagKind } from '@/application/tag/tag.types';
import { PostController } from '@/controllers/post/post';
import { UserController } from '@/controllers/user/user';
import type { NexusTaggers } from '@/services/nexus/nexus.types';
import { useEntityTaggers } from './useEntityTaggers';
import { TAGGERS_PAGE_SIZE } from './useEntityTaggers.constants';

vi.mock('@/controllers/post/post', () => ({
  PostController: {
    fetchTaggers: vi.fn(),
  },
}));

vi.mock('@/controllers/user/user', () => ({
  UserController: {
    fetchTaggers: vi.fn(),
  },
}));

describe('useEntityTaggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stays disabled without complete entity context', async () => {
    const { result } = renderHook(() => useEntityTaggers(null, null));

    await act(async () => {
      await result.current.fetchAllTaggers('bitcoin', ['initial-tagger'], 2);
    });

    expect(result.current.taggersByLabel.size).toBe(0);
    expect(PostController.fetchTaggers).not.toHaveBeenCalled();
    expect(UserController.fetchTaggers).not.toHaveBeenCalled();
  });

  it('fetches post taggers from the post controller', async () => {
    vi.mocked(PostController.fetchTaggers).mockResolvedValue({
      users: ['tagger-3', 'tagger-4'],
      relationship: false,
    });
    const { result } = renderHook(() => useEntityTaggers('author:post-id', TagKind.POST));

    await act(async () => {
      await result.current.fetchAllTaggers('bitcoin', ['tagger-1', 'tagger-2'], 4);
    });

    expect(PostController.fetchTaggers).toHaveBeenCalledWith({
      compositeId: 'author:post-id',
      label: 'bitcoin',
      skip: 2,
      limit: TAGGERS_PAGE_SIZE,
    });
    expect(UserController.fetchTaggers).not.toHaveBeenCalled();
    expect(result.current.taggersByLabel.get('bitcoin')).toEqual(['tagger-1', 'tagger-2', 'tagger-3', 'tagger-4']);
  });

  it('fetches every remaining profile tagger page from the user controller', async () => {
    const initialIds = ['tagger-1', 'tagger-2', 'tagger-3', 'tagger-4', 'tagger-5'];
    vi.mocked(UserController.fetchTaggers)
      .mockResolvedValueOnce([
        {
          users: ['tagger-6', 'tagger-7', 'tagger-8', 'tagger-9', 'tagger-10'],
          relationship: false,
        },
      ])
      .mockResolvedValueOnce([
        {
          users: ['tagger-11', 'tagger-12'],
          relationship: false,
        },
      ]);
    const { result } = renderHook(() => useEntityTaggers('profile-pubky', TagKind.USER));

    await act(async () => {
      await result.current.fetchAllTaggers('Synonym', initialIds, 12);
    });

    expect(UserController.fetchTaggers).toHaveBeenNthCalledWith(1, {
      user_id: 'profile-pubky',
      label: 'Synonym',
      skip: 5,
      limit: TAGGERS_PAGE_SIZE,
    });
    expect(UserController.fetchTaggers).toHaveBeenNthCalledWith(2, {
      user_id: 'profile-pubky',
      label: 'Synonym',
      skip: 10,
      limit: TAGGERS_PAGE_SIZE,
    });
    expect(PostController.fetchTaggers).not.toHaveBeenCalled();
    expect(result.current.taggersByLabel.get('synonym')).toEqual([
      ...initialIds,
      'tagger-6',
      'tagger-7',
      'tagger-8',
      'tagger-9',
      'tagger-10',
      'tagger-11',
      'tagger-12',
    ]);
  });

  it('deduplicates taggers and reuses a completed cached result', async () => {
    vi.mocked(UserController.fetchTaggers).mockResolvedValue([
      {
        users: ['tagger-2', 'tagger-3'],
        relationship: false,
      },
    ]);
    const { result } = renderHook(() => useEntityTaggers('profile-pubky', TagKind.USER));

    await act(async () => {
      await result.current.fetchAllTaggers('bitcoin', ['tagger-1', 'tagger-2'], 3);
    });
    await act(async () => {
      await result.current.fetchAllTaggers('bitcoin', ['tagger-1', 'tagger-2'], 3);
    });

    expect(UserController.fetchTaggers).toHaveBeenCalledTimes(1);
    expect(result.current.taggersByLabel.get('bitcoin')).toEqual(['tagger-1', 'tagger-2', 'tagger-3']);
  });

  it('discards a response after the entity context changes', async () => {
    let resolveRequest: (value: NexusTaggers[]) => void = () => {};
    const pendingResponse = new Promise<NexusTaggers[]>((resolve) => {
      resolveRequest = resolve;
    });
    vi.mocked(UserController.fetchTaggers).mockReturnValue(pendingResponse);

    const { result, rerender } = renderHook(
      ({ taggedId }: { taggedId: string }) => useEntityTaggers(taggedId, TagKind.USER),
      { initialProps: { taggedId: 'first-profile' } },
    );

    let request: Promise<void> = Promise.resolve();
    act(() => {
      request = result.current.fetchAllTaggers('bitcoin', ['initial-tagger'], 2);
    });

    await waitFor(() => {
      expect(UserController.fetchTaggers).toHaveBeenCalledTimes(1);
    });

    rerender({ taggedId: 'second-profile' });

    await act(async () => {
      resolveRequest([{ users: ['stale-tagger'], relationship: false }]);
      await request;
    });

    expect(result.current.taggersByLabel.size).toBe(0);
  });
});
