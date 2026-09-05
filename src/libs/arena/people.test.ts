import { describe, expect, it } from 'vitest';
import type { UserStreamUser } from '@/hooks/useUserStream/useUserStream.types';
import { REACH } from '@/stores/home/home.types';
import { TIMEFRAME } from '@/stores/hot/hot.types';
import { getArenaPeopleStreamId, rankArenaPeople } from './people';

const users: UserStreamUser[] = [
  {
    id: 'active',
    name: 'Active',
    bio: '',
    image: null,
    avatarUrl: null,
    status: null,
    counts: { posts: 2, replies: 12, tags: 9, followers: 1, following: 0 },
  },
  {
    id: 'popular',
    name: 'Popular',
    bio: '',
    image: null,
    avatarUrl: null,
    status: null,
    counts: { posts: 3, replies: 20, tags: 1, followers: 20, following: 0 },
  },
  {
    id: 'poster',
    name: 'Poster',
    bio: '',
    image: null,
    avatarUrl: null,
    status: null,
    counts: { posts: 30, replies: 5, tags: 1, followers: 20, following: 0 },
  },
];

describe('Arena people ranking', () => {
  it('uses the homepage stream with the selected window and maps network to WoT', () => {
    expect(getArenaPeopleStreamId(TIMEFRAME.THIS_WEEK, REACH.NETWORK)).toBe('influencers:this_week:wot');
    expect(getArenaPeopleStreamId(TIMEFRAME.TODAY, REACH.FRIENDS)).toBe('influencers:today:friends');
    expect(getArenaPeopleStreamId(TIMEFRAME.ALL_TIME, REACH.ALL)).toBe('influencers:all_time:all');
  });
  it('preserves the existing activity order', () => {
    expect(rankArenaPeople(users, 'active')).toEqual(users);
  });
  it('maps popular to followers and breaks count ties in activity order without mutating input', () => {
    expect(rankArenaPeople(users, 'popular').map(({ id }) => id)).toEqual(['popular', 'poster', 'active']);
    expect(users[0].id).toBe('active');
  });
  it('ranks by the same tags and posts counts displayed on the homepage', () => {
    expect(rankArenaPeople(users, 'tags')[0].id).toBe('active');
    expect(rankArenaPeople(users, 'posts')[0].id).toBe('poster');
    expect(rankArenaPeople(users, 'replies')[0].id).toBe('popular');
  });
});
