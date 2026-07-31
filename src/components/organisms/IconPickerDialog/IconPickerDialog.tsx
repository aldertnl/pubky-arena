'use client';

import { type ReactNode, type UIEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/atoms/Button/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/atoms/Dialog/Dialog';
import { DynamicLucideIcon } from '@/atoms/DynamicLucideIcon/DynamicLucideIcon';
import { Input } from '@/atoms/Input/Input';
import { Label } from '@/atoms/Label/Label';
import { isLucideIconName, LUCIDE_ICON_NAMES } from '@/libs/utils/lucideIcons';
import { cn } from '@/libs/utils/utils';

const ICON_BATCH_SIZE = 96;
const LOAD_MORE_THRESHOLD_PX = 80;

export interface IconPickerDialogProps {
  children?: ReactNode;
  value?: string | null;
  onSelect: (iconName: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  icons?: readonly string[];
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function IconPickerDialog({
  children,
  value,
  onSelect,
  open,
  defaultOpen = false,
  onOpenChange,
  icons = LUCIDE_ICON_NAMES,
  title,
  description,
  searchPlaceholder,
  emptyMessage,
}: IconPickerDialogProps) {
  const t = useTranslations('dialogs.iconPicker');
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ICON_BATCH_SIZE);
  const resolvedOpen = open ?? internalOpen;

  const resolvedTitle = title ?? t('title');
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('searchPlaceholder');
  const resolvedEmptyMessage = emptyMessage ?? t('emptyMessage');
  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, '-');
  const filteredIcons = icons.filter((iconName) => isLucideIconName(iconName) && iconName.includes(normalizedQuery));
  const visibleIcons = filteredIcons.slice(0, visibleCount);

  useEffect(() => {
    if (resolvedOpen) return;
    setQuery('');
    setVisibleCount(ICON_BATCH_SIZE);
  }, [resolvedOpen]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) setInternalOpen(nextOpen);
    if (!nextOpen) {
      setQuery('');
      setVisibleCount(ICON_BATCH_SIZE);
    }
    onOpenChange?.(nextOpen);
  };

  const handleSelect = (iconName: string) => {
    onSelect(iconName);
    handleOpenChange(false);
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight <= LOAD_MORE_THRESHOLD_PX;
    if (isNearBottom && visibleCount < filteredIcons.length) {
      setVisibleCount((currentCount) => Math.min(currentCount + ICON_BATCH_SIZE, filteredIcons.length));
    }
  };

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent
        className="flex h-110 w-145 max-w-[calc(100vw-2rem)] flex-col gap-6 overflow-hidden p-6 sm:max-w-145 sm:p-8"
        data-testid="icon-picker-dialog-content"
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>{resolvedTitle}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <Label htmlFor="icon-picker-search" className="sr-only">
          {resolvedSearchPlaceholder}
        </Label>
        <Input
          id="icon-picker-search"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(ICON_BATCH_SIZE);
          }}
          placeholder={resolvedSearchPlaceholder}
          aria-label={resolvedSearchPlaceholder}
          className="h-14 shrink-0 rounded-md border border-dashed border-input px-6 text-lg shadow-none"
          data-testid="icon-picker-search"
        />

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2"
          onScroll={handleScroll}
          data-testid="icon-picker-scroll-area"
        >
          {visibleIcons.length > 0 ? (
            <div className="grid grid-cols-6 gap-x-2 gap-y-4 sm:grid-cols-11" data-testid="icon-picker-grid">
              {visibleIcons.map((iconName) => {
                const isSelected = iconName === value;
                const accessibleName = iconName.replaceAll('-', ' ');

                return (
                  <Button
                    key={iconName}
                    type="button"
                    variant={isSelected ? 'default' : 'ghost'}
                    size="icon"
                    aria-label={accessibleName}
                    aria-pressed={isSelected}
                    title={accessibleName}
                    onClick={() => handleSelect(iconName)}
                    className={cn(
                      'size-9 rounded-md p-0 shadow-none',
                      !isSelected && 'text-foreground hover:text-foreground',
                    )}
                    data-testid={`icon-picker-option-${iconName}`}
                  >
                    <DynamicLucideIcon name={iconName} fallback={null} className="size-6" aria-hidden="true" />
                  </Button>
                );
              })}
            </div>
          ) : (
            <p
              className="flex h-full items-center justify-center text-sm text-muted-foreground"
              data-testid="icon-picker-empty"
            >
              {resolvedEmptyMessage}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
