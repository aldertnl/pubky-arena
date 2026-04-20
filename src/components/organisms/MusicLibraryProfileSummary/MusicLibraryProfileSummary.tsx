'use client';

import * as Atoms from '@/atoms';
import * as Hooks from '@/hooks';
import * as Libs from '@/libs';
import * as Providers from '@/providers';

export function MusicLibraryProfileSummary() {
  const { pubky } = Providers.useProfileContext();
  const { summary, isLoading } = Hooks.useMusicLibraryProfileSummary(pubky);

  if (isLoading || !summary || summary.topArtists.length === 0) {
    return null;
  }

  return (
    <Atoms.Card className="gap-4 p-4">
      <Atoms.Container overrideDefaults={true} className="flex min-w-0 items-start gap-3">
        <Atoms.Container
          overrideDefaults={true}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/12"
        >
          <Libs.Music className="size-5 text-brand" />
        </Atoms.Container>
        <Atoms.Container overrideDefaults={true} className="flex min-w-0 flex-col gap-1">
          <Atoms.Typography as="p" className="text-sm font-semibold text-foreground">
            Music Snapshot
          </Atoms.Typography>
          <Atoms.Typography as="p" className="text-sm leading-6 text-muted-foreground">
            Public profile summary based on this user&apos;s top artists.
          </Atoms.Typography>
        </Atoms.Container>
      </Atoms.Container>

      <Atoms.Container className="gap-3">
        {summary.topArtists.map((artistSummary) => (
          <MusicLibraryProfileSummaryItem key={artistSummary.artist} artistSummary={artistSummary} />
        ))}
      </Atoms.Container>

      <Atoms.Typography as="p" className="text-xs text-muted-foreground">
        Showing up to 5 artists from {summary.totalItems} saved music entries.
      </Atoms.Typography>
    </Atoms.Card>
  );
}

function MusicLibraryProfileSummaryItem({
  artistSummary,
}: {
  artistSummary: {
    artist: string;
    album: string | null;
    track: string;
  };
}) {
  const { imageUrl, isLoading } = Hooks.useMusicAlbumCover({
    artist: artistSummary.artist,
    album: artistSummary.album ?? undefined,
  });

  return (
    <Atoms.Container overrideDefaults={true} className="flex flex-col gap-3 p-3">
      <div className="relative mx-auto aspect-square w-full max-w-28 overflow-hidden rounded-full">
        {imageUrl ? (
          <Atoms.Image
            fill
            src={imageUrl}
            alt={`${artistSummary.artist} album cover`}
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 320px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs font-medium text-muted-foreground">
            {isLoading ? 'Loading cover...' : 'No cover'}
          </div>
        )}
      </div>

      <Atoms.Container overrideDefaults={true} className="flex min-w-0 flex-col items-center gap-1 text-center">
        <Atoms.Typography as="p" className="w-full truncate text-center text-sm font-semibold text-foreground">
          {artistSummary.artist}
        </Atoms.Typography>
        {artistSummary.album ? (
          <Atoms.Typography as="p" className="w-full truncate text-center text-xs text-muted-foreground">
            {artistSummary.album}
          </Atoms.Typography>
        ) : (
          <Atoms.Typography as="p" className="text-center text-xs text-muted-foreground">
            {artistSummary.track}
          </Atoms.Typography>
        )}
      </Atoms.Container>
    </Atoms.Container>
  );
}
