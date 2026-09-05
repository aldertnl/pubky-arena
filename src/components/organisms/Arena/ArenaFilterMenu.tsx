'use client';

import { type ComponentType, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Container } from '@/atoms/Container/Container';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/atoms/DropdownMenu/DropdownMenu';
import { SidebarButton } from '@/atoms/SidebarButton/SidebarButton';
import { Typography } from '@/atoms/Typography/Typography';

interface ArenaFilterMenuProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string; icon: ComponentType<{ className?: string }> }[];
  onChange: (value: T) => void;
  lowercase?: boolean;
}

/** Collection picker presentation, composed from the same native menu and button atoms. */
export function ArenaFilterMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  lowercase = false,
}: ArenaFilterMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const active = options.find((option) => option.value === value) ?? options[0];
  const ActiveIcon = active.icon;
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <SidebarButton
          icon={ActiveIcon}
          className="w-auto focus-visible:border-border focus-visible:ring-0"
          aria-label={`${label}: ${active.label}`}
        >
          <Typography as="span" overrideDefaults>
            {lowercase ? active.label.toLowerCase() : active.label}
          </Typography>
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </SidebarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-70" aria-label={label}>
        <Container overrideDefaults className="flex w-full flex-col gap-3">
          {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
            <DropdownMenuItem
              key={optionValue}
              aria-current={optionValue === value ? 'true' : undefined}
              className="w-full gap-2 p-0 text-base font-medium text-muted-foreground"
              onSelect={() => {
                setOpen(false);
                if (optionValue !== value) onChange(optionValue);
              }}
            >
              <Icon className="size-4" aria-hidden="true" />
              <Typography as="span" overrideDefaults className="min-w-0 flex-1 truncate">
                {optionLabel}
              </Typography>
              {optionValue === value && <Check aria-hidden="true" className="size-4 text-brand" />}
            </DropdownMenuItem>
          ))}
        </Container>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
