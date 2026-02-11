import type { Pubky } from '@/core';
import type { AutocompleteUserData } from '@/hooks';

export interface RepostersOverlayProps {
  /** Display variant - dialog for desktop, sheet for mobile */
  variant: 'dialog' | 'sheet';
  /** Whether the overlay is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Full list of reposter IDs (source of truth) - ensures overlay shows all reposters even when details are partially loaded */
  reposterIds: Pubky[];
  /** Fallback user data from parent - WhoTaggedExpandedList merges with cache for early name/avatar display */
  fallbackReposters?: AutocompleteUserData[];
}
