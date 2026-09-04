import * as React from 'react';

export interface TagProps {
  name: string;
  /** Optional character limit for the displayed label; the full name is preserved. */
  maxLabelLength?: number;
  count?: number;
  /** Optional context icon next to the existing count. */
  countIcon?: React.ReactNode;
  clicked?: boolean;
  onClick?: (tagName: string) => void;
  className?: React.HTMLAttributes<HTMLDivElement>['className'];
  'data-testid'?: string;
  'data-cy'?: string;
  countDataCy?: string;
  style?: React.CSSProperties;
}
