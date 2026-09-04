import type { ButtonHTMLAttributes, CSSProperties, MouseEvent, ReactNode } from 'react';

export interface PostTagProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'color'> {
  /** Tag label text */
  label: string;
  /** Optional character limit for the displayed label; the full label is preserved. */
  maxLabelLength?: number;
  /** Number of posts with this tag (optional) */
  count?: number;
  /** Optional icon describing what the count measures. */
  countIcon?: ReactNode;
  /** Show the close/remove button */
  showClose?: boolean;
  /** Selected state */
  selected?: boolean;
  /** Optional outline and shadow styling for the selected state. */
  selectedStyle?: Pick<CSSProperties, 'borderColor' | 'boxShadow'>;
  /** Callback when tag is clicked */
  onClick?: (e: MouseEvent) => void;
  /** Callback when close button is clicked */
  onClose?: (e: MouseEvent) => void;
  /** Custom color (hex) for the tag - if not provided, generates from label */
  color?: string;
}
