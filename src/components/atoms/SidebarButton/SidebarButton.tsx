import { forwardRef } from 'react';
import { cn } from '@/libs/utils/utils';
import { Button } from '../Button/Button';
import type { SidebarButtonProps } from './SidebarButton.types';

export const SidebarButton = forwardRef<HTMLButtonElement, SidebarButtonProps>(
  ({ icon: Icon, children, className, ...props }, ref) => (
    <Button
      ref={ref}
      variant="dark-outline"
      size="sm"
      className={cn('w-full border-border bg-white/5 text-xs font-bold', className)}
      {...props}
    >
      <Icon className="size-4" />
      {children}
    </Button>
  ),
);
SidebarButton.displayName = 'SidebarButton';
