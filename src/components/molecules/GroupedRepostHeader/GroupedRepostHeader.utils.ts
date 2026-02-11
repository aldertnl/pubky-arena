import * as Libs from '@/libs';
import type { GetFirstReposterNameParams } from './GroupedRepostHeader.types';

const ELLIPSIS = '...';
const ELLIPSIS_LENGTH = ELLIPSIS.length;

/**
 * Truncates string so total length (including "...") does not exceed maxLength.
 * Requires maxLength >= 4 to show ellipsis; smaller values return str.slice(0, maxLength) without ellipsis.
 *
 * @example truncateReposterName("Pablo", 5) → "Pablo"; "Pablosa" → "Pa..."
 */
export function truncateReposterName(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  if (maxLength <= ELLIPSIS_LENGTH) return str.slice(0, maxLength);
  return str.slice(0, maxLength - ELLIPSIS_LENGTH) + ELLIPSIS;
}

/**
 * Determines the display name for the first reposter.
 * Returns "You" label if current user, profile name if loaded, or formatted pubky as fallback.
 */
export function getFirstReposterName({
  includesCurrentUser,
  isFirstReposterLoading,
  firstReposterProfile,
  firstReposterId,
  youLabel,
}: GetFirstReposterNameParams): string {
  if (includesCurrentUser) {
    return youLabel;
  }
  if (isFirstReposterLoading) {
    return '...';
  }
  // Return raw name - truncation by max length is applied in the component (desktop vs mobile)
  if (firstReposterProfile?.name) {
    return firstReposterProfile.name;
  }
  return Libs.formatPublicKey({ key: firstReposterId });
}
