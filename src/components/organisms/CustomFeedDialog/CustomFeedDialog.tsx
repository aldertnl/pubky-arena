'use client';

import { type ComponentType, type ReactNode, useEffect, useState } from 'react';
import {
  CirclePlay,
  Columns3,
  Delete,
  Download,
  Flame,
  HeartHandshake,
  Image,
  Layers,
  LayoutGrid,
  Library,
  Link,
  Newspaper,
  Radio,
  Rows2,
  Rows4,
  SquareAsterisk,
  StickyNote,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PubkyAppFeedLayout, PubkyAppFeedReach, PubkyAppFeedSort, PubkyAppPostKind } from 'pubky-app-specs';
import { Button } from '@/atoms/Button/Button';
import { Container } from '@/atoms/Container/Container';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/atoms/Dialog/Dialog';
import { DynamicLucideIcon } from '@/atoms/DynamicLucideIcon/DynamicLucideIcon';
import { Input } from '@/atoms/Input/Input';
import { Label } from '@/atoms/Label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/atoms/Select/Select';
import { DEFAULT_CUSTOM_FEED_ICON } from '@/config/feed';
import { useCustomFeed } from '@/hooks/useCustomFeed/useCustomFeed';
import { useCustomFeedForm } from '@/hooks/useCustomFeedForm/useCustomFeedForm';
import { UsersRound2 } from '@/icons';
import { getMaxStreamTags } from '@/libs/runtime-config/runtime-config';
import { isLucideIconName } from '@/libs/utils/lucideIcons';
import type { FeedModelSchema } from '@/models/feed/feed.schema';
import { PostTag } from '@/molecules/PostTag/PostTag';
import { TagInput } from '@/molecules/TagInput/TagInput';
import { IconPickerDialog } from '@/organisms/IconPickerDialog/IconPickerDialog';

type CustomFeedDialogProps =
  | {
      mode: 'create';
      children: ReactNode;
      feed?: never;
    }
  | {
      mode: 'edit';
      children: ReactNode;
      feed?: FeedModelSchema;
    };
type CustomFeedDialogContent = PubkyAppPostKind | 'ALL';
function isVisualCustomFeedContentSupported(content?: CustomFeedDialogContent): boolean {
  return content === 'ALL' || content === PubkyAppPostKind.Image || content === PubkyAppPostKind.Video;
}

export const CustomFeedDialog = (props: CustomFeedDialogProps) => {
  if (props.mode === 'edit' && !props.feed) {
    return <RouteCustomFeedDialog>{props.children}</RouteCustomFeedDialog>;
  }

  return <CustomFeedDialogForm {...props} />;
};

const RouteCustomFeedDialog = ({ children }: { children: ReactNode }) => {
  const routeFeed = useCustomFeed();

  return (
    <CustomFeedDialogForm mode="edit" feed={routeFeed}>
      {children}
    </CustomFeedDialogForm>
  );
};

type CustomFeedDialogFormProps = {
  mode: 'create' | 'edit';
  children: ReactNode;
  feed?: FeedModelSchema;
};

const CustomFeedDialogForm = ({ mode, children, feed: customFeed }: CustomFeedDialogFormProps) => {
  const { loading, submit, deleteFeed } = useCustomFeedForm({
    mode,
    feed: customFeed,
  });
  const tFilter = useTranslations('filters');
  const tDialog = useTranslations('dialogs.customFeed');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(DEFAULT_CUSTOM_FEED_ICON);
  const [reach, setReach] = useState<PubkyAppFeedReach | undefined>(
    mode === 'create' ? PubkyAppFeedReach.All : undefined,
  );
  const [sort, setSort] = useState<PubkyAppFeedSort | undefined>(
    mode === 'create' ? PubkyAppFeedSort.Recent : undefined,
  );
  const [layout, setLayout] = useState<PubkyAppFeedLayout | undefined>(
    mode === 'create' ? PubkyAppFeedLayout.Columns : undefined,
  );
  const [content, setContent] = useState<CustomFeedDialogContent | undefined>(mode === 'create' ? 'ALL' : undefined);
  const [tags, setTags] = useState<string[]>([]);
  const disabled = loading || (mode === 'edit' && !customFeed);
  useEffect(() => {
    if (open) return;
    if (mode === 'create') {
      setName('');
      setIcon(DEFAULT_CUSTOM_FEED_ICON);
      setReach(PubkyAppFeedReach.All);
      setSort(PubkyAppFeedSort.Recent);
      setLayout(PubkyAppFeedLayout.Columns);
      setContent('ALL');
      setTags([]);
    } else if (mode === 'edit') {
      setName(customFeed?.name ?? '');
      setIcon(customFeed?.icon && isLucideIconName(customFeed.icon) ? customFeed.icon : DEFAULT_CUSTOM_FEED_ICON);
      setReach(customFeed?.reach);
      setSort(customFeed?.sort);
      setLayout(customFeed?.layout);
      setContent(customFeed?.content === null ? 'ALL' : customFeed?.content);
      setTags(customFeed?.tags ?? []);
    }
  }, [open, mode, customFeed]);
  const reachFilters = [
    {
      value: PubkyAppFeedReach.All,
      label: tFilter('reach.all'),
      icon: Radio,
    },
    {
      value: PubkyAppFeedReach.Following,
      label: tFilter('reach.following'),
      icon: UsersRound2,
    },
    {
      value: PubkyAppFeedReach.Friends,
      label: tFilter('reach.friends'),
      icon: HeartHandshake,
    },
  ];
  const sortFilters = [
    {
      value: PubkyAppFeedSort.Recent,
      label: tFilter('sort.recent'),
      icon: SquareAsterisk,
    },
    {
      value: PubkyAppFeedSort.Popularity,
      label: tFilter('sort.popularity'),
      icon: Flame,
    },
  ];
  const layoutFilters = [
    {
      value: PubkyAppFeedLayout.Columns,
      label: tFilter('layout.columns'),
      icon: Columns3,
    },
    {
      value: PubkyAppFeedLayout.Wide,
      label: tFilter('layout.wide'),
      icon: Rows2,
    },
    {
      value: PubkyAppFeedLayout.Visual,
      label: tFilter('layout.visual'),
      icon: LayoutGrid,
    },
    {
      value: PubkyAppFeedLayout.List,
      label: tFilter('layout.list'),
      icon: Rows4,
    },
  ];
  const allContentFilters: Array<{
    value: CustomFeedDialogContent;
    label: string;
    icon: ComponentType;
  }> = [
    {
      value: 'ALL',
      label: tFilter('content.all'),
      icon: Layers,
    },
    {
      value: PubkyAppPostKind.Short,
      label: tFilter('content.posts'),
      icon: StickyNote,
    },
    {
      value: PubkyAppPostKind.Long,
      label: tFilter('content.articles'),
      icon: Newspaper,
    },
    {
      value: PubkyAppPostKind.Collection,
      label: tFilter('content.collections'),
      icon: Library,
    },
    {
      value: PubkyAppPostKind.Image,
      label: tFilter('content.images'),
      icon: Image,
    },
    {
      value: PubkyAppPostKind.Video,
      label: tFilter('content.videos'),
      icon: CirclePlay,
    },
    {
      value: PubkyAppPostKind.Link,
      label: tFilter('content.links'),
      icon: Link,
    },
    {
      value: PubkyAppPostKind.File,
      label: tFilter('content.files'),
      icon: Download,
    },
  ];
  const contentFilters =
    layout === PubkyAppFeedLayout.Visual
      ? allContentFilters.filter((filter) => isVisualCustomFeedContentSupported(filter.value))
      : allContentFilters;
  useEffect(() => {
    if (layout !== PubkyAppFeedLayout.Visual) return;
    if (content === undefined || isVisualCustomFeedContentSupported(content)) return;
    setContent('ALL');
  }, [content, layout]);
  const handleLayoutChange = (value: string) => {
    const nextLayout = Number(value) as PubkyAppFeedLayout;
    setLayout(nextLayout);
    if (
      nextLayout === PubkyAppFeedLayout.Visual &&
      content !== undefined &&
      !isVisualCustomFeedContentSupported(content)
    ) {
      setContent('ALL');
    }
  };
  const handleSaveFeed = async () => {
    if (reach === undefined || sort === undefined || layout === undefined || content === undefined) return;

    const saved = await submit({
      name,
      icon,
      reach,
      sort,
      layout,
      content,
      tags,
    });

    if (saved) setOpen(false);
  };
  const handleDeleteFeed = async () => {
    const deleted = await deleteFeed();

    if (deleted) setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={mode === 'edit' && !customFeed} data-testid="custom-feed-dialog-trigger">
        {children}
      </DialogTrigger>

      <DialogContent
        onOpenAutoFocus={(e) => {
          if (mode === 'edit') e.preventDefault();
        }}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-3xl"
        data-testid="custom-feed-dialog-content"
      >
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? tDialog('createTitle') : tDialog('editTitle')}</DialogTitle>
        </DialogHeader>

        <Container className="gap-y-2">
          <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('feedName')}</Label>

          <Input
            required
            placeholder={tDialog('feedNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled}
            className="h-14 border-dashed"
            data-testid="feed-name-input"
          />
        </Container>

        <Container className="gap-y-2">
          <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('feedIcon')}</Label>

          <IconPickerDialog
            value={icon}
            onSelect={setIcon}
            title={tDialog('feedIcon')}
            description={mode === 'create' ? tDialog('feedIconCreateDescription') : tDialog('feedIconEditDescription')}
          >
            <Button
              type="button"
              variant="secondary"
              className="w-fit gap-2 border-transparent px-4 shadow-none"
              aria-label={tDialog('chooseIcon')}
              disabled={disabled}
              data-testid="feed-icon-picker-trigger"
            >
              <DynamicLucideIcon name={icon} className="size-4 shrink-0" />
              {tDialog('chooseIcon')}
            </Button>
          </IconPickerDialog>
        </Container>

        <Container className="flex-wrap gap-x-8 gap-y-4 sm:flex-row">
          <Container overrideDefaults className="flex flex-col gap-y-2" data-testid="reach-filter-section">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('reach')}</Label>

            <Select
              value={reach === undefined ? reach : String(reach)}
              onValueChange={(v) => setReach(Number(v))}
              disabled={disabled}
              data-testid="reach-select"
            >
              <SelectTrigger className="w-full sm:w-fit">
                <SelectValue placeholder={tDialog('reachPlaceholder')} />
              </SelectTrigger>

              <SelectContent>
                {reachFilters.map((r) => (
                  <SelectItem key={r.value} value={String(r.value)}>
                    <r.icon /> {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Container>

          <Container overrideDefaults className="flex flex-col gap-y-2" data-testid="sort-filter-section">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('sort')}</Label>

            <Select
              value={sort === undefined ? sort : String(sort)}
              onValueChange={(v) => setSort(Number(v))}
              disabled={disabled}
              data-testid="sort-select"
            >
              <SelectTrigger className="w-full sm:w-fit">
                <SelectValue placeholder={tDialog('sortPlaceholder')} />
              </SelectTrigger>

              <SelectContent>
                {sortFilters.map((r) => (
                  <SelectItem key={r.value} value={String(r.value)}>
                    <r.icon /> {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Container>

          <Container overrideDefaults className="flex flex-col gap-y-2" data-testid="layout-filter-section">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('layout')}</Label>

            <Select
              value={layout === undefined ? layout : String(layout)}
              onValueChange={handleLayoutChange}
              disabled={disabled}
              data-testid="layout-select"
            >
              <SelectTrigger className="w-full sm:w-fit">
                <SelectValue placeholder={tDialog('layoutPlaceholder')} />
              </SelectTrigger>

              <SelectContent>
                {layoutFilters.map((r) => (
                  <SelectItem key={r.value} value={String(r.value)}>
                    <r.icon /> {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Container>

          <Container overrideDefaults className="flex flex-col gap-y-2" data-testid="content-filter-section">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('content')}</Label>

            <Select
              value={content === undefined ? content : String(content)}
              onValueChange={(v) => setContent(v === 'ALL' ? v : Number(v))}
              disabled={disabled}
              data-testid="content-select"
            >
              <SelectTrigger className="w-full sm:w-fit">
                <SelectValue placeholder={tDialog('contentPlaceholder')} />
              </SelectTrigger>

              <SelectContent>
                {contentFilters.map((r) => (
                  <SelectItem key={r.value} value={String(r.value)}>
                    <r.icon /> {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Container>
        </Container>

        <Container className="gap-y-2">
          <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('filterTags')}</Label>

          <TagInput
            onTagAdd={(tag) => setTags([...tags, tag])}
            existingTags={tags.map((tag) => ({
              label: tag,
            }))}
            showCloseButton={false}
            disabled={disabled}
            maxTags={getMaxStreamTags()}
            currentTagsCount={tags.length}
            enableApiSuggestions
            excludeFromApiSuggestions={tags}
            addOnSuggestionClick
            className="w-48"
            data-testid="feed-tag-input"
          />

          {tags.length > 0 && (
            <Container className="flex-row flex-wrap gap-2">
              {tags.map((tag, index) => (
                <PostTag
                  key={`${tag}-${index}`}
                  label={tag}
                  showClose={!disabled}
                  onClose={() => setTags((prevTags) => prevTags.filter((_, i) => i !== index))}
                />
              ))}
            </Container>
          )}
        </Container>

        <DialogFooter>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleSaveFeed}
            disabled={disabled || !name || !tags.length}
            className="h-15 w-full"
            data-testid="save-feed-button"
          >
            <DynamicLucideIcon name={icon} className="size-4" />
            {tDialog('saveFeed')}
          </Button>

          {mode === 'edit' && (
            <Button
              variant="destructive"
              size="lg"
              onClick={handleDeleteFeed}
              disabled={disabled}
              className="h-15 w-full"
              data-testid="delete-feed-button"
            >
              <Delete className="size-4" />
              {tDialog('deleteFeed')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
