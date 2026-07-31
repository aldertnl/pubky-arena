'use client';

import { Activity, type LucideIcon, type LucideProps } from 'lucide-react';
import { DynamicIcon } from 'lucide-react/dynamic.js';
import { isLucideIconName } from '@/libs/utils/lucideIcons';

export interface DynamicLucideIconProps extends Omit<LucideProps, 'name'> {
  name?: string | null;
  fallback?: LucideIcon | null;
}

export function DynamicLucideIcon({ name, fallback, ...iconProps }: DynamicLucideIconProps) {
  const FallbackIcon = fallback === undefined ? Activity : fallback;

  if (!isLucideIconName(name)) {
    return FallbackIcon ? <FallbackIcon {...iconProps} /> : null;
  }

  return (
    <DynamicIcon name={name} fallback={() => (FallbackIcon ? <FallbackIcon {...iconProps} /> : null)} {...iconProps} />
  );
}
