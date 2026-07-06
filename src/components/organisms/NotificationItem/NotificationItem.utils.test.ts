import { describe, expect, it } from 'vitest';
import { type FlatNotification, NotificationType } from '@/models/notification/notification.types';
import { getNotificationLink } from './NotificationItem.utils';

describe('NotificationItem.utils navigation links', () => {
  it('routes collection notifications to /collections/... when kind is known', () => {
    const notification = {
      type: NotificationType.TagPost,
      post_uri: 'user1:collection123',
    } as FlatNotification;

    expect(getNotificationLink(notification, 'collection')).toEqual({
      notificationLink: '/collections/user1/collection123',
      userProfileLink: null,
    });
  });

  it('routes reply notifications to the parent post when kind is known', () => {
    const notification = {
      type: NotificationType.Reply,
      replied_by: 'replier-user',
      parent_post_uri: 'pubky://original-author/pub/pubky.app/posts/parent-post-id',
      reply_uri: 'pubky://replier-user/pub/pubky.app/posts/reply-post-id',
    } as FlatNotification;

    expect(getNotificationLink(notification, 'short')).toEqual({
      notificationLink: '/post/original-author/parent-post-id',
      userProfileLink: '/profile/replier-user',
    });
  });

  it('withholds post links until kind is resolved', () => {
    const notification = {
      type: NotificationType.TagPost,
      tagged_by: 'user1',
      post_uri: 'user1:post123',
    } as FlatNotification;

    expect(getNotificationLink(notification)).toEqual({
      notificationLink: null,
      userProfileLink: '/profile/user1',
    });
  });
});
