import type { ComponentType } from 'react';

export interface SidebarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ComponentType<{ className?: string }>;
  children: React.ReactNode;
}
