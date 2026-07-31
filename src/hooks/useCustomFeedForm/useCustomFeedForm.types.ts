import { PubkyAppFeedLayout, PubkyAppFeedReach, PubkyAppFeedSort, PubkyAppPostKind } from 'pubky-app-specs';
import { z } from 'zod';
import { DEFAULT_CUSTOM_FEED_ICON } from '@/config/feed';
import { isLucideIconName } from '@/libs/utils/lucideIcons';
import type { FeedModelSchema } from '@/models/feed/feed.schema';

/** Sentinel for "no content filter" — stored as `null` on the feed record. */
export const CUSTOM_FEED_CONTENT_ALL = 'ALL';

export const CUSTOM_FEED_FORM_FIELDS = {
  NAME: 'name',
  ICON: 'icon',
  REACH: 'reach',
  SORT: 'sort',
  LAYOUT: 'layout',
  CONTENT: 'content',
  TAGS: 'tags',
} as const;

/**
 * Schema for the create/edit custom feed form.
 *
 * Unlike `useCreateCollection`, this is not a translator factory: the dialog
 * surfaces validation by disabling the save button rather than rendering field
 * messages, so zod's default messages are never shown to a user and there is
 * nothing to localize. Add a factory here if a field ever renders its error.
 */
export const customFeedFormSchema = z.object({
  [CUSTOM_FEED_FORM_FIELDS.NAME]: z.string().refine((value) => value.trim().length > 0),
  [CUSTOM_FEED_FORM_FIELDS.ICON]: z.string().min(1),
  [CUSTOM_FEED_FORM_FIELDS.REACH]: z.enum(PubkyAppFeedReach),
  [CUSTOM_FEED_FORM_FIELDS.SORT]: z.enum(PubkyAppFeedSort),
  [CUSTOM_FEED_FORM_FIELDS.LAYOUT]: z.enum(PubkyAppFeedLayout),
  [CUSTOM_FEED_FORM_FIELDS.CONTENT]: z.union([z.literal(CUSTOM_FEED_CONTENT_ALL), z.enum(PubkyAppPostKind)]),
  [CUSTOM_FEED_FORM_FIELDS.TAGS]: z.array(z.string()).min(1),
});

export type CustomFeedFormData = z.infer<typeof customFeedFormSchema>;
export type CustomFeedFormContent = CustomFeedFormData['content'];

/** Default values for a brand new feed. */
export const customFeedFormDefaults: CustomFeedFormData = {
  [CUSTOM_FEED_FORM_FIELDS.NAME]: '',
  [CUSTOM_FEED_FORM_FIELDS.ICON]: DEFAULT_CUSTOM_FEED_ICON,
  [CUSTOM_FEED_FORM_FIELDS.REACH]: PubkyAppFeedReach.All,
  [CUSTOM_FEED_FORM_FIELDS.SORT]: PubkyAppFeedSort.Recent,
  [CUSTOM_FEED_FORM_FIELDS.LAYOUT]: PubkyAppFeedLayout.Columns,
  [CUSTOM_FEED_FORM_FIELDS.CONTENT]: CUSTOM_FEED_CONTENT_ALL,
  [CUSTOM_FEED_FORM_FIELDS.TAGS]: [],
};

/**
 * Maps a stored feed onto form values for edit mode.
 *
 * An icon we cannot resolve falls back to the default so the picker trigger
 * always renders something — the stored value may come from another client
 * using its own icon set.
 */
export function customFeedFormValuesFromFeed(feed: FeedModelSchema): CustomFeedFormData {
  return {
    [CUSTOM_FEED_FORM_FIELDS.NAME]: feed.name,
    [CUSTOM_FEED_FORM_FIELDS.ICON]: isLucideIconName(feed.icon) ? feed.icon : DEFAULT_CUSTOM_FEED_ICON,
    [CUSTOM_FEED_FORM_FIELDS.REACH]: feed.reach,
    [CUSTOM_FEED_FORM_FIELDS.SORT]: feed.sort,
    [CUSTOM_FEED_FORM_FIELDS.LAYOUT]: feed.layout,
    [CUSTOM_FEED_FORM_FIELDS.CONTENT]: feed.content === null ? CUSTOM_FEED_CONTENT_ALL : feed.content,
    [CUSTOM_FEED_FORM_FIELDS.TAGS]: feed.tags,
  };
}

type UseCustomFeedFormBaseParams = {
  /**
   * Whether the host dialog is currently open. The hook re-seeds the form from
   * `feed` whenever this is false, so a dialog reopened after a background sync
   * shows current values without discarding in-progress edits.
   */
  open: boolean;
};

export type UseCustomFeedFormParams = UseCustomFeedFormBaseParams &
  ({ mode: 'create'; feed?: never } | { mode: 'edit'; feed: FeedModelSchema });
