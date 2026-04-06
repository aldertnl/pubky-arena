import type { TimelineFeedVariant } from '@/config';

export interface LeftSidebarFiltersProps {
  hideReachFilter?: boolean;
  hideLayoutFilter?: boolean;
  allowVisualLayout?: boolean;
  /** When true, only layout is interactive; reach/sort/content are disabled (e.g. SinglePost). */
  layoutOnly?: boolean;
  feedVariant?: TimelineFeedVariant;
  variant?: 'sidebar' | 'drawer';
}
