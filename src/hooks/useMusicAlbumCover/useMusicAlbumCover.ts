'use client';

import { useEffect, useState } from 'react';

export interface MusicAlbumCoverResult {
  imageUrl: string | null;
}

const albumCoverCache = new Map<
  string,
  {
    data: MusicAlbumCoverResult;
    timestamp: number;
  }
>();

const CACHE_TTL = 1000 * 60 * 60 * 24;

export function useMusicAlbumCover(params: { artist: string; album?: string } | null) {
  const [cover, setCover] = useState<MusicAlbumCoverResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const artist = params?.artist?.trim();
    const album = params?.album?.trim();

    if (!artist) {
      console.log('[MusicLibraryAlbumCover] skipped', {
        artist: artist ?? null,
        album: album ?? null,
        reason: 'artist-missing',
      });
      setCover(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const searchParams = new URLSearchParams({ artist });
    if (album) {
      searchParams.set('album', album);
    }
    const apiUrl = `/api/music-library/album-cover?${searchParams.toString()}`;

    const cached = albumCoverCache.get(apiUrl);
    if (cached && cached.data.imageUrl && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[MusicLibraryAlbumCover] cache hit', {
        artist,
        album,
        strategy: album ? 'artist-and-album' : 'artist-only',
        imageUrl: cached.data.imageUrl,
      });
      setCover(cached.data);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setError(null);

    console.log('[MusicLibraryAlbumCover] fetch start', {
      artist,
      album,
      strategy: album ? 'artist-and-album' : 'artist-only',
      apiUrl,
    });

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch album cover');
        }

        return response.json();
      })
      .then((data: MusicAlbumCoverResult) => {
        if (cancelled) {
          return;
        }

        console.log('[MusicLibraryAlbumCover] fetched', {
          artist,
          album,
          strategy: album ? 'artist-and-album' : 'artist-only',
          imageUrl: data.imageUrl,
        });

        if (data.imageUrl) {
          albumCoverCache.set(apiUrl, {
            data,
            timestamp: Date.now(),
          });
        } else {
          albumCoverCache.delete(apiUrl);
        }

        setCover(data);
        setIsLoading(false);
      })
      .catch((fetchError: Error) => {
        if (cancelled) {
          return;
        }

        console.warn('[MusicLibraryAlbumCover] fetch failed', {
          artist,
          album,
          strategy: album ? 'artist-and-album' : 'artist-only',
          apiUrl,
          message: fetchError.message,
        });
        setError(fetchError);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params?.album, params?.artist]);

  return {
    imageUrl: cover?.imageUrl ?? null,
    isLoading,
    error,
  };
}
