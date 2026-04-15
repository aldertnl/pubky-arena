'use client';

import type { ReactNode } from 'react';
import * as Atoms from '@/atoms';
import * as Hooks from '@/hooks';

export interface MusicLibraryListProps {
  items: Hooks.MusicLibraryItem[];
  isLoading?: boolean;
  isSaving?: boolean;
  onRefreshAction: () => void | Promise<void>;
  onDeleteAction: (id: string) => void | Promise<void>;
  children?: ReactNode;
}

export function MusicLibraryList({
  items,
  isLoading = false,
  isSaving = false,
  onRefreshAction,
  onDeleteAction,
  children,
}: MusicLibraryListProps) {
  return (
    <Atoms.Card>
      <Atoms.CardHeader className="gap-3">
        <Atoms.Container
          overrideDefaults={true}
          className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <Atoms.Container overrideDefaults={true} className="min-w-0 gap-1">
            <Atoms.CardTitle>Saved Music Library</Atoms.CardTitle>
            <Atoms.CardDescription className="break-words">
              This section will eventually hydrate from cache first, then fall back to the homeserver.
            </Atoms.CardDescription>
          </Atoms.Container>
          <Atoms.Button
            variant="outline"
            size="sm"
            onClick={onRefreshAction}
            disabled={isLoading || isSaving}
            className="w-full shrink-0 sm:w-auto"
          >
            Refresh
          </Atoms.Button>
        </Atoms.Container>
      </Atoms.CardHeader>
      <Atoms.CardContent>
        {isLoading ? (
          <Atoms.Container overrideDefaults={true} className="flex min-h-32 items-center justify-center">
            <Atoms.Spinner />
          </Atoms.Container>
        ) : items.length === 0 ? (
          <Atoms.Container className="rounded-xl border border-dashed bg-muted/20 p-6">
            <Atoms.Typography as="p" className="font-semibold text-foreground">
              No saved tracks yet
            </Atoms.Typography>
            <Atoms.Typography as="p" className="text-sm leading-6 text-muted-foreground">
              Add your first item below to shape the Music Library UI before the real persistence layer lands.
            </Atoms.Typography>
          </Atoms.Container>
        ) : (
          <Atoms.Container className="gap-3">
            {items.map((item) => (
              <MusicLibraryListItem key={item.id} item={item} isSaving={isSaving} onDeleteAction={onDeleteAction} />
            ))}
          </Atoms.Container>
        )}
      </Atoms.CardContent>
      {children ? <Atoms.CardFooter className="block border-t pt-6">{children}</Atoms.CardFooter> : null}
    </Atoms.Card>
  );
}

function MusicLibraryListItem({
  item,
  isSaving,
  onDeleteAction,
}: {
  item: Hooks.MusicLibraryItem;
  isSaving: boolean;
  onDeleteAction: (id: string) => void | Promise<void>;
}) {
  const { imageUrl, isLoading } = Hooks.useMusicAlbumCover({
    artist: item.artist,
    album: item.album || undefined,
  });

  return (
    <Atoms.Container className="gap-3 rounded-xl border bg-muted/20 p-4">
      <Atoms.Container overrideDefaults={true} className="flex items-start gap-3 sm:gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full">
          {imageUrl ? (
            <Atoms.Image fill src={imageUrl} alt={`${item.album} album cover`} className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] font-medium text-muted-foreground">
              {isLoading ? 'Loading cover...' : 'No cover'}
            </div>
          )}
        </div>

        <Atoms.Container overrideDefaults={true} className="min-w-0 flex-1 gap-3">
          <Atoms.Container
            overrideDefaults={true}
            className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
          >
            <Atoms.Container overrideDefaults={true} className="min-w-0 gap-1">
              <Atoms.Typography as="p" className="break-words font-semibold text-foreground sm:truncate">
                {item.track}
              </Atoms.Typography>
              <Atoms.Typography as="p" className="break-words text-sm text-muted-foreground">
                {item.artist}
                {item.album ? ` · ${item.album}` : ''}
              </Atoms.Typography>
            </Atoms.Container>
            <Atoms.Container overrideDefaults={true} className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
              <Atoms.Button
                variant="ghost"
                size="sm"
                disabled
                className="w-full px-0 text-muted-foreground sm:w-auto sm:px-3"
              >
                Edit
              </Atoms.Button>
              <Atoms.Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteAction(item.id)}
                disabled={isSaving}
                className="w-full px-0 text-muted-foreground sm:w-auto sm:px-3"
              >
                Delete
              </Atoms.Button>
            </Atoms.Container>
          </Atoms.Container>

          <Atoms.Container overrideDefaults={true} className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {item.genre ? <Atoms.Badge variant="outline">{item.genre}</Atoms.Badge> : null}
            {item.year ? <Atoms.Badge variant="outline">{item.year}</Atoms.Badge> : null}
            {item.rating ? <Atoms.Badge variant="outline">{`${item.rating}/5`}</Atoms.Badge> : null}
          </Atoms.Container>
        </Atoms.Container>
      </Atoms.Container>
    </Atoms.Container>
  );
}
