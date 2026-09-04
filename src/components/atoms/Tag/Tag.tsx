'use client';

import * as React from 'react';
import { cn, generateRandomColor, hexToRgba } from '@/libs/utils/utils';
import { Typography } from '../Typography/Typography';
import type { TagProps } from './Tag.types';

export const Tag = ({
  name,
  maxLabelLength,
  count,
  countIcon,
  clicked = false,
  onClick,
  className,
  'data-testid': dataTestId,
  'data-cy': dataCy,
  countDataCy,
  ...props
}: TagProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const characters = Array.from(name);
  const label =
    maxLabelLength !== undefined && characters.length > maxLabelLength
      ? `${characters.slice(0, maxLabelLength).join('')}…`
      : name;

  const { backgroundColor, borderColor } = React.useMemo(() => {
    const base = generateRandomColor(name);
    return {
      backgroundColor: hexToRgba(base, 0.3),
      borderColor: hexToRgba(base, 0.5),
    };
  }, [name]);

  const handleClick = () => {
    onClick?.(name);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className={cn(
        'flex h-8 w-fit max-w-full min-w-0 cursor-pointer items-center justify-between rounded-md px-3 transition-all duration-200',
        maxLabelLength !== undefined && 'max-w-none shrink-0',
        className,
      )}
      style={{
        backgroundColor: backgroundColor,
        border: clicked ? `1px solid ${borderColor}` : '1px solid transparent',
        boxShadow: !clicked && isHovered ? `inset 0 0 10px 2px ${borderColor}` : undefined,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={name}
      data-testid={dataTestId || 'tag'}
      data-cy={dataCy || 'tag'}
      {...props}
    >
      <Typography
        size="sm"
        className={cn('truncate font-bold', maxLabelLength !== undefined && 'shrink-0')}
        data-testid="tag-name"
        data-cy={`${dataCy || 'tag'}-name`}
      >
        {label}
      </Typography>

      {count !== undefined && (
        <Typography
          size="sm"
          className={cn(
            'ml-1.5 shrink-0 font-medium text-foreground/50',
            countIcon && 'inline-flex items-center gap-1',
          )}
          data-testid="tag-count"
          data-cy={countDataCy || `${dataCy || 'tag'}-count`}
        >
          {countIcon}
          {count}
        </Typography>
      )}
    </div>
  );
};
