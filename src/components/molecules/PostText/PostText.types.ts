import { AnchorHTMLAttributes, ClassAttributes } from 'react';
import type React from 'react';
import { ExtraProps } from 'react-markdown';

export interface PostTextProps {
  content: string;
  isArticle?: boolean;
  onLinkClick?: (url: string, e: React.MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
  /** Content is already a preview snippet truncated by the caller: skip internal truncation and the Show more button, but still shorten long link text. */
  isPreTruncated?: boolean;
}

export type RemarkAnchorProps = ClassAttributes<HTMLAnchorElement> &
  AnchorHTMLAttributes<HTMLAnchorElement> &
  ExtraProps & { 'data-type'?: string };
