import type React from 'react';

export interface PostActionsBarProps {
  postId: string;
  onTagClick?: () => void;
  onReplyClick?: () => void;
  onRepostClick?: () => void;
  className?: string;
  variant?: 'default' | 'visual';
  /** When true, renders only the tag toggle button (collections card/hero). */
  tagOnly?: boolean;
}

export interface ActionButtonConfig {
  id: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; fill?: string }>;
  count?: number;
  onClick?: () => void;
  ariaLabel: string;
  className?: string;
  iconProps?: { fill?: string; className?: string };
  disabled?: boolean;
}
