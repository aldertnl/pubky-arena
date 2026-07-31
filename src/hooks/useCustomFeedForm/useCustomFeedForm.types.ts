import { PubkyAppFeedLayout, PubkyAppFeedReach, PubkyAppFeedSort, PubkyAppPostKind } from 'pubky-app-specs';
import type { FeedModelSchema } from '@/models/feed/feed.schema';

export type CustomFeedFormMode = 'create' | 'edit';
export type CustomFeedFormContent = PubkyAppPostKind | 'ALL';

export interface CustomFeedFormValues {
  name: string;
  icon: string;
  reach: PubkyAppFeedReach;
  sort: PubkyAppFeedSort;
  layout: PubkyAppFeedLayout;
  content: CustomFeedFormContent;
  tags: string[];
}

export interface UseCustomFeedFormParams {
  mode: CustomFeedFormMode;
  feed?: FeedModelSchema;
}
