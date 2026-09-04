'use client';

import { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Tag as TagIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/atoms/Button/Button';
import { Label } from '@/atoms/Label/Label';
import { Popover, PopoverContent, PopoverTrigger } from '@/atoms/Popover/Popover';
import { Tag } from '@/atoms/Tag/Tag';
import { Typography } from '@/atoms/Typography/Typography';
import { ARENA_TOPIC_LIMIT } from '@/libs/arena/arena';
import { generateRandomColor, hexToRgba } from '@/libs/utils/utils';
import { ControlledInputField } from '@/molecules/ControlledInputField/ControlledInputField';
import { PostTag } from '@/molecules/PostTag/PostTag';
import { type ArenaTagForm, type ArenaTagPickerProps, arenaTagSchema } from './ArenaTagPicker.types';

export function ArenaTagPicker({ topic, topics, timeframeLabel, onTopic }: ArenaTagPickerProps) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<ArenaTagForm>({ resolver: zodResolver(arenaTagSchema), defaultValues: { tag: '' } });

  return (
    <span data-arena-tag-picker className="relative inline-flex align-middle">
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) form.reset({ tag: '' });
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            overrideDefaults={!!topic}
            variant="secondary"
            size="sm"
            className={
              topic
                ? 'relative h-8 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
                : 'text-xs'
            }
            aria-label="Choose topic tag"
          >
            {topic ? (
              <Tag name={topic} maxLabelLength={14} className="pr-9" />
            ) : (
              <>
                <TagIcon className="size-4" aria-hidden="true" />
                tag
              </>
            )}
            <ChevronDown
              className={topic ? 'pointer-events-none absolute top-2.5 right-2.5 size-3.5' : 'size-3.5'}
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="mx-0 w-70 max-w-[calc(100vw-2rem)] bg-background shadow-xl"
          aria-label="Choose topic tag"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            formRef.current?.querySelector('input')?.focus();
          }}
        >
          <div className="mb-3 space-y-3">
            <Typography
              as="h3"
              overrideDefaults
              className="text-xs leading-4 font-medium tracking-[0.075rem] text-muted-foreground uppercase"
            >
              TOP #{ARENA_TOPIC_LIMIT} TAGS {timeframeLabel}
            </Typography>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Top tags">
              {topics.slice(0, ARENA_TOPIC_LIMIT).map((tag) => (
                <PostTag
                  key={tag.label}
                  label={tag.label}
                  count={tag.tagged_count}
                  maxLabelLength={14}
                  selectedStyle={{
                    borderColor: generateRandomColor(tag.label),
                    boxShadow: `inset 0 0 8px 0 ${generateRandomColor(tag.label)}, 0 0 32px 8px ${hexToRgba(generateRandomColor(tag.label), 0.32)}`,
                  }}
                  selected={tag.label === topic}
                  onClick={() => {
                    onTopic(tag.label);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
          <form
            ref={formRef}
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit(({ tag }) => {
              onTopic(tag);
              setOpen(false);
            })}
          >
            <Label htmlFor="tag" className="sr-only">
              Topic tag
            </Label>
            <ControlledInputField
              control={form.control}
              name="tag"
              placeholder="custom tag"
              variant="default"
              size="md"
            />
          </form>
        </PopoverContent>
      </Popover>
    </span>
  );
}
