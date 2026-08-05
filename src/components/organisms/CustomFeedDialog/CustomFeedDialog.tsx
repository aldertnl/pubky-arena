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
  Tags,
  UserRound,
  Waypoints,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PubkyAppFeedLayout, PubkyAppFeedReach, PubkyAppFeedSort, PubkyAppPostKind } from 'pubky-app-specs';
import { Controller, useWatch } from 'react-hook-form';
import { Button } from '@/atoms/Button/Button';
import { Container } from '@/atoms/Container/Container';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/atoms/Dialog/Dialog';
import { DynamicLucideIcon } from '@/atoms/DynamicLucideIcon/DynamicLucideIcon';
import { Input } from '@/atoms/Input/Input';
import { Label } from '@/atoms/Label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/atoms/Select/Select';
import { Typography } from '@/atoms/Typography/Typography';
import { useCustomFeedForm } from '@/hooks/useCustomFeedForm/useCustomFeedForm';
import {
  CUSTOM_FEED_CONTENT_ALL,
  CUSTOM_FEED_FORM_FIELDS,
  type CustomFeedFormContent,
  type CustomFeedFormReach,
} from '@/hooks/useCustomFeedForm/useCustomFeedForm.types';
import { UsersRound2 } from '@/icons';
import { getMaxStreamTags } from '@/libs/runtime-config/runtime-config';
import type { FeedModelSchema } from '@/models/feed/feed.schema';
import { TAGGED_AS_FILTER_KEY } from '@/molecules/Filters/FilterReach/FilterReach';
import { PostTag } from '@/molecules/PostTag/PostTag';
import { TagInput } from '@/molecules/TagInput/TagInput';
import { IconPickerDialog } from '@/organisms/IconPickerDialog/IconPickerDialog';
import { HOME_PROFILE_TAGS_MAX_SELECTED } from '@/stores/home/home.types';

type CustomFeedDialogProps =
  | {
      mode: 'create';
      children: ReactNode;
      feed?: never;
    }
  | {
      mode: 'edit';
      children: ReactNode;
      feed: FeedModelSchema;
    };

function isVisualCustomFeedContentSupported(content?: CustomFeedFormContent): boolean {
  return (
    content === CUSTOM_FEED_CONTENT_ALL || content === PubkyAppPostKind.Image || content === PubkyAppPostKind.Video
  );
}

function parseReachValue(value: string): CustomFeedFormReach {
  return value === TAGGED_AS_FILTER_KEY ? TAGGED_AS_FILTER_KEY : (Number(value) as PubkyAppFeedReach);
}

export const CustomFeedDialog = (props: CustomFeedDialogProps) => {
  const { mode, children } = props;
  const [open, setOpen] = useState(false);
  // Read `feed` off `props` rather than destructuring it: the props union ties
  // `feed` to `mode`, and destructuring erases that link for TS.
  const { form, loading, submit, deleteFeed } = useCustomFeedForm(
    props.mode === 'edit' ? { mode: 'edit', feed: props.feed, open } : { mode: 'create', open },
  );
  const tFilter = useTranslations('filters');
  const tDialog = useTranslations('dialogs.customFeed');

  const { control } = form;
  const layout = useWatch({ control, name: CUSTOM_FEED_FORM_FIELDS.LAYOUT });
  const content = useWatch({ control, name: CUSTOM_FEED_FORM_FIELDS.CONTENT });
  const icon = useWatch({ control, name: CUSTOM_FEED_FORM_FIELDS.ICON });
  const reach = useWatch({ control, name: CUSTOM_FEED_FORM_FIELDS.REACH });
  const domainTags = useWatch({ control, name: CUSTOM_FEED_FORM_FIELDS.DOMAIN_TAGS }) ?? [];

  const isTaggedAsReach = reach === TAGGED_AS_FILTER_KEY;
  const isAtProfileTagLimit = domainTags.length >= HOME_PROFILE_TAGS_MAX_SELECTED;

  const reachFilters = [
    {
      value: PubkyAppFeedReach.Wot,
      label: tFilter('reach.network'),
      icon: Waypoints,
    },
    {
      value: TAGGED_AS_FILTER_KEY,
      label: tFilter('reach.taggedAs'),
      icon: Tags,
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
    {
      value: PubkyAppFeedReach.Me,
      label: tFilter('reach.me'),
      icon: UserRound,
    },
    {
      value: PubkyAppFeedReach.All,
      label: tFilter('reach.all'),
      icon: Radio,
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
    value: CustomFeedFormContent;
    label: string;
    icon: ComponentType;
  }> = [
    {
      value: CUSTOM_FEED_CONTENT_ALL,
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

  // Catches a stored feed whose layout/content pair another client left in a
  // combination this dialog cannot represent; user-driven layout changes are
  // corrected up-front in `handleLayoutChange`.
  useEffect(() => {
    if (layout !== PubkyAppFeedLayout.Visual) return;
    if (isVisualCustomFeedContentSupported(content)) return;
    form.setValue(CUSTOM_FEED_FORM_FIELDS.CONTENT, CUSTOM_FEED_CONTENT_ALL, { shouldValidate: true });
  }, [content, layout, form]);

  const handleLayoutChange = (value: string, onChange: (next: PubkyAppFeedLayout) => void) => {
    const nextLayout = Number(value) as PubkyAppFeedLayout;
    onChange(nextLayout);
    if (nextLayout === PubkyAppFeedLayout.Visual && !isVisualCustomFeedContentSupported(content)) {
      form.setValue(CUSTOM_FEED_FORM_FIELDS.CONTENT, CUSTOM_FEED_CONTENT_ALL, { shouldValidate: true });
    }
  };

  const handleReachChange = (value: string) => {
    const nextReach = parseReachValue(value);
    // setValue (not only Controller.onChange) so useWatch subscribers reliably
    // re-render — needed to reveal the profile-tags section for Tagged as.
    form.setValue(CUSTOM_FEED_FORM_FIELDS.REACH, nextReach, {
      shouldValidate: true,
      shouldDirty: true,
    });
    // Profile tags are authored only via Tagged as. Leaving that surface (or
    // any other explicit reach pick) drops legacy domain tags so they cannot
    // silently persist on an unsupported reach after save.
    if (nextReach !== TAGGED_AS_FILTER_KEY) {
      form.setValue(CUSTOM_FEED_FORM_FIELDS.DOMAIN_TAGS, [], { shouldValidate: true });
    }
  };

  const handleDomainTagAdd = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (
      !isTaggedAsReach ||
      !normalizedTag ||
      domainTags.length >= HOME_PROFILE_TAGS_MAX_SELECTED ||
      domainTags.some((existingTag) => existingTag.toLowerCase() === normalizedTag)
    ) {
      return;
    }
    form.setValue(CUSTOM_FEED_FORM_FIELDS.DOMAIN_TAGS, [...domainTags, normalizedTag], {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleSaveFeed = async () => {
    const saved = await submit();

    if (saved) setOpen(false);
  };
  const handleDeleteFeed = async () => {
    const deleted = await deleteFeed();

    if (deleted) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild data-testid="custom-feed-dialog-trigger">
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

          <Controller
            name={CUSTOM_FEED_FORM_FIELDS.NAME}
            control={control}
            render={({ field }) => (
              <Input
                required
                placeholder={tDialog('feedNamePlaceholder')}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={loading}
                className="h-14 border-dashed"
                data-testid="feed-name-input"
              />
            )}
          />
        </Container>

        <Container className="gap-y-2">
          <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('feedIcon')}</Label>

          <Controller
            name={CUSTOM_FEED_FORM_FIELDS.ICON}
            control={control}
            render={({ field }) => (
              <IconPickerDialog
                value={field.value}
                onSelect={field.onChange}
                title={tDialog('feedIcon')}
                description={
                  mode === 'create' ? tDialog('feedIconCreateDescription') : tDialog('feedIconEditDescription')
                }
              >
                <Button
                  type="button"
                  variant="secondary"
                  className="w-fit gap-2 border-transparent px-4 shadow-none"
                  aria-label={tDialog('chooseIcon')}
                  disabled={loading}
                  data-testid="feed-icon-picker-trigger"
                >
                  <DynamicLucideIcon name={field.value} className="size-4 shrink-0" />
                  {tDialog('chooseIcon')}
                </Button>
              </IconPickerDialog>
            )}
          />
        </Container>

        <Container className="flex-wrap gap-x-8 gap-y-4 sm:flex-row">
          <Container overrideDefaults className="flex flex-col gap-y-2" data-testid="reach-filter-section">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('reach')}</Label>

            <Controller
              name={CUSTOM_FEED_FORM_FIELDS.REACH}
              control={control}
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  onValueChange={handleReachChange}
                  disabled={loading}
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
              )}
            />
          </Container>

          <Container overrideDefaults className="flex flex-col gap-y-2" data-testid="sort-filter-section">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('sort')}</Label>

            <Controller
              name={CUSTOM_FEED_FORM_FIELDS.SORT}
              control={control}
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                  disabled={loading}
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
              )}
            />
          </Container>

          <Container overrideDefaults className="flex flex-col gap-y-2" data-testid="layout-filter-section">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('layout')}</Label>

            <Controller
              name={CUSTOM_FEED_FORM_FIELDS.LAYOUT}
              control={control}
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => handleLayoutChange(v, field.onChange)}
                  disabled={loading}
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
              )}
            />
          </Container>

          <Container overrideDefaults className="flex flex-col gap-y-2" data-testid="content-filter-section">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('content')}</Label>

            <Controller
              name={CUSTOM_FEED_FORM_FIELDS.CONTENT}
              control={control}
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(v === CUSTOM_FEED_CONTENT_ALL ? v : Number(v))}
                  disabled={loading}
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
              )}
            />
          </Container>
        </Container>

        <Container className="gap-y-2">
          <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('postTags')}</Label>

          <Typography overrideDefaults className="text-base leading-6 font-medium text-secondary-foreground">
            {tDialog('postTagsDescription')}
          </Typography>

          <Controller
            name={CUSTOM_FEED_FORM_FIELDS.TAGS}
            control={control}
            render={({ field }) => (
              <>
                <TagInput
                  onTagAdd={(tag) => field.onChange([...field.value, tag])}
                  existingTags={field.value.map((tag) => ({
                    label: tag,
                  }))}
                  showCloseButton={false}
                  disabled={loading}
                  maxTags={getMaxStreamTags()}
                  currentTagsCount={field.value.length}
                  enableApiSuggestions
                  excludeFromApiSuggestions={field.value}
                  addOnSuggestionClick
                  className="w-48"
                  data-testid="feed-tag-input"
                />

                {field.value.length > 0 && (
                  <Container className="flex-row flex-wrap gap-2">
                    {field.value.map((tag, index) => (
                      <PostTag
                        key={`${tag}-${index}`}
                        label={tag}
                        showClose={!loading}
                        onClose={() => field.onChange(field.value.filter((_, i) => i !== index))}
                      />
                    ))}
                  </Container>
                )}
              </>
            )}
          />
        </Container>

        {(isTaggedAsReach || domainTags.length > 0) && (
          <Container className="gap-y-2" data-testid="profile-tags-section">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">{tDialog('profileTags')}</Label>

            <Typography overrideDefaults className="text-base leading-6 font-medium text-secondary-foreground">
              {tDialog('profileTagsDescription')}
            </Typography>

            {isTaggedAsReach && (
              <TagInput
                onTagAdd={handleDomainTagAdd}
                placeholder={tFilter('reach.profileTag')}
                existingTags={domainTags.map((label) => ({ label }))}
                viewerTags={domainTags.map((label) => ({ label }))}
                disabled={loading}
                maxTags={HOME_PROFILE_TAGS_MAX_SELECTED}
                currentTagsCount={domainTags.length}
                limitReachedPlaceholder={tFilter('reach.profileTagLimitReached', {
                  max: HOME_PROFILE_TAGS_MAX_SELECTED,
                })}
                showEmojiButton={!isAtProfileTagLimit}
                enableApiSuggestions
                excludeFromApiSuggestions={domainTags}
                addOnSuggestionClick
                className="w-48"
                data-testid="feed-profile-tag-input"
              />
            )}

            {domainTags.length > 0 && (
              <Container className="flex-row flex-wrap gap-2">
                {domainTags.map((tag, index) => (
                  <PostTag
                    key={`${tag}-${index}`}
                    label={tag}
                    showClose={isTaggedAsReach && !loading}
                    onClose={() =>
                      form.setValue(
                        CUSTOM_FEED_FORM_FIELDS.DOMAIN_TAGS,
                        domainTags.filter((_, i) => i !== index),
                        { shouldValidate: true, shouldDirty: true },
                      )
                    }
                  />
                ))}
              </Container>
            )}
          </Container>
        )}

        <DialogFooter>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleSaveFeed}
            disabled={loading || !form.formState.isValid}
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
              disabled={loading}
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
