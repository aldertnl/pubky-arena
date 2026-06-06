'use client';

import { Loader2 } from 'lucide-react';
import { usePostHomeserverVerification } from '@/hooks/usePostHomeserverVerification/usePostHomeserverVerification';
import { HomeserverSeen, VerifyBadge } from '@/icons';
import { cn } from '@/libs/utils/utils';
import type { PostHomeserverVerifyIconProps } from './PostHomeserverVerifyIcon.types';

export function PostHomeserverVerifyIcon({ postId, variant = 'default' }: PostHomeserverVerifyIconProps) {
  const { status, verify, isVerified } = usePostHomeserverVerification(postId);
  const isChecking = status === 'checking';

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void verify();
  };

  const iconClassName = cn(
    variant === 'visual'
      ? isVerified
        ? '!text-brand'
        : 'text-white/70'
      : isVerified
        ? 'text-brand'
        : 'text-muted-foreground',
  );

  return (
    <button
      type="button"
      aria-busy={isChecking}
      disabled={isChecking || isVerified}
      onClick={handleClick}
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        isChecking ? 'cursor-wait opacity-70' : 'cursor-pointer',
        (isVerified || isChecking) && 'cursor-default',
      )}
    >
      {isChecking ? (
        <Loader2 className={cn('size-4 shrink-0 animate-spin', iconClassName)} aria-hidden="true" />
      ) : isVerified ? (
        <VerifyBadge size={16} className={iconClassName} aria-hidden="true" />
      ) : (
        <HomeserverSeen size={16} className={iconClassName} aria-hidden="true" />
      )}
      <span className="sr-only">Verify post on homeserver</span>
    </button>
  );
}
