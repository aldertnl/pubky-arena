'use client';

import { type ClipboardEvent, type KeyboardEvent, type ReactNode, useState } from 'react';
import { Library, MessageCircle, Plus, Repeat } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Controller } from 'react-hook-form';
import { Button } from '@/atoms/Button/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/atoms/Card/Card';
import { Container } from '@/atoms/Container/Container';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/atoms/Dialog/Dialog';
import { Label } from '@/atoms/Label/Label';
import { Typography } from '@/atoms/Typography/Typography';
import { GRID_FEED_COLUMNS_CLASS, GRID_FEED_GAP_CLASS } from '@/config/feed';
import { useAddPostByUrl } from '@/hooks/useAddPostByUrl/useAddPostByUrl';
import { ADD_CONTENT_DIALOG_NAMESPACE, type AddContentTarget } from '@/hooks/useAddPostByUrl/useAddPostByUrl.types';
import { cn } from '@/libs/utils/utils';
import { InputField } from '@/molecules/InputField/InputField';
import { useTimelineFeedContext } from '@/organisms/Timeline/Feed/TimelineFeed/TimelineFeedContext';

const URL_FIELD = 'url';

type AddContentDialogProps = {
  target: AddContentTarget;
};

export function AddContentDialog({ target }: AddContentDialogProps) {
  const t = useTranslations(ADD_CONTENT_DIALOG_NAMESPACE);
  const [open, setOpen] = useState(false);

  const timelineFeed = useTimelineFeedContext();
  const handleAdded = (postId: string) => {
    timelineFeed?.prependItems(postId);
  };

  const { form, submit, reset } = useAddPostByUrl({ target, onAddedAction: handleAdded });

  const isSaving = form.formState.isSubmitting;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  };

  const handleAdd = async (urlOverride?: string) => {
    const added = await submit(urlOverride);
    if (added) handleOpenChange(false);
  };

  const handleUrlInputPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text/plain').trim();
    if (!text) return;

    event.preventDefault();
    void handleAdd(text);
  };

  const handleUrlInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void handleAdd();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <AddContentCtaTrigger target={target} />
      <DialogContent
        className="max-w-xl outline-none focus-visible:outline-none"
        data-cy="add-content-dialog"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <Container overrideDefaults className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
          <Card className="overflow-hidden rounded-md text-left" data-cy="add-content-from-feed">
            <CardHeader>
              <CardTitle className="text-base font-bold md:text-brand">{t('feedTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Typography overrideDefaults className="text-sm leading-5 font-medium text-muted-foreground">
                <Typography
                  as="span"
                  overrideDefaults
                  className="font-bold text-brand md:font-medium md:text-muted-foreground"
                >
                  {t('feedInstructionLead')}
                </Typography>
                {t('feedInstructionRest')}
              </Typography>
            </CardContent>
            <CardFooter>
              <PostActionsPreview />
            </CardFooter>
          </Card>

          <Card className="overflow-hidden rounded-md">
            <CardHeader>
              <CardTitle className="text-base font-bold">{t('urlTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Typography overrideDefaults className="text-sm leading-5 font-medium text-muted-foreground">
                {t('urlInstruction')}
              </Typography>
            </CardContent>
            <CardFooter>
              <Container overrideDefaults className="w-full">
                <Label htmlFor={URL_FIELD} className="sr-only">
                  {t('urlInputLabel')}
                </Label>
                <Controller
                  name={URL_FIELD}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <InputField
                      id={URL_FIELD}
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      onPaste={handleUrlInputPaste}
                      onKeyDown={handleUrlInputKeyDown}
                      placeholder="https://"
                      variant="dashed"
                      size="lg"
                      disabled={isSaving}
                      loading={isSaving}
                      status={fieldState.error ? 'error' : 'default'}
                      message={fieldState.error?.message}
                      messageType={fieldState.error ? 'error' : 'default'}
                      dataCy="add-content-url-input"
                    />
                  )}
                />
                <Button
                  type="button"
                  overrideDefaults
                  className="sr-only"
                  disabled={isSaving}
                  onClick={() => void handleAdd()}
                >
                  {t('submitUrl')}
                </Button>
              </Container>
            </CardFooter>
          </Card>
        </Container>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Shared dashed "Add Content" CTA rendered as the default dialog trigger. Sized
 * to a single feed grid cell so it lines up with the post cards beside it.
 */
function AddContentCtaTrigger({ target }: { target: AddContentTarget }) {
  const t = useTranslations('collections.single');
  const dataCy = target.kind === 'bookmark' ? 'bookmarks-add-content' : 'collection-add-content';

  return (
    <Container overrideDefaults data-cy={dataCy} className={cn('grid', GRID_FEED_COLUMNS_CLASS, GRID_FEED_GAP_CLASS)}>
      <DialogTrigger asChild>
        <Button
          overrideDefaults
          aria-label={t('addContent')}
          className="flex h-39 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <Plus className="size-4 shrink-0" />
          <Typography as="span" overrideDefaults className="text-sm font-bold">
            {t('addContent')}
          </Typography>
        </Button>
      </DialogTrigger>
    </Container>
  );
}

function PostActionsPreview() {
  return (
    <Container overrideDefaults className="flex w-full flex-wrap items-center justify-start gap-2">
      <ActionPill className="opacity-30">
        <MessageCircle className="size-4" />
        <Typography as="span" overrideDefaults>
          7
        </Typography>
      </ActionPill>
      <ActionPill className="opacity-30">
        <Repeat className="size-4" />
        <Typography as="span" overrideDefaults>
          3
        </Typography>
      </ActionPill>
      <ActionPill className="drop-shadow-[0_0_8px_var(--color-brand)]">
        <Library className="size-4" />
      </ActionPill>
    </Container>
  );
}

function ActionPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Container
      overrideDefaults
      className={cn(
        'flex h-8 w-fit items-center justify-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 text-xs font-bold text-muted-foreground shadow-xs',
        className,
      )}
    >
      {children}
    </Container>
  );
}
