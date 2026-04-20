'use client';

import { useEffect, useState } from 'react';

export interface MusicAlbumCoverParams {
  artist: string;
  album?: string;
}

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
const SESSION_STORAGE_KEY_PREFIX = 'music-library-album-cover:';

export async function prefetchMusicAlbumCover(
  params: MusicAlbumCoverParams | null,
): Promise<MusicAlbumCoverResult | null> {
  const normalizedParams = normalizeMusicAlbumCoverParams(params);

  if (!normalizedParams) {
    return null;
  }

  try {
    const cover = await loadMusicAlbumCover(normalizedParams);
    if (cover.imageUrl) {
      warmCoverImage(cover.imageUrl);
    }

    return cover;
  } catch (error) {
    console.warn('[MusicLibraryAlbumCover] prefetch failed', {
      artist: normalizedParams.artist,
      album: normalizedParams.album,
      strategy: normalizedParams.album ? 'artist-and-album' : 'artist-only',
      apiUrl: normalizedParams.apiUrl,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

export function useMusicAlbumCover(params: MusicAlbumCoverParams | null) {
  const [cover, setCover] = useState<MusicAlbumCoverResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const normalizedParams = normalizeMusicAlbumCoverParams(params);

    if (!normalizedParams) {
      console.log('[MusicLibraryAlbumCover] skipped', {
        artist: params?.artist?.trim() ?? null,
        album: params?.album?.trim() ?? null,
        reason: 'artist-missing',
      });
      setCover(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const cached = albumCoverCache.get(normalizedParams.apiUrl);
    if (cached && cached.data.imageUrl && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[MusicLibraryAlbumCover] cache hit', {
        artist: normalizedParams.artist,
        album: normalizedParams.album,
        strategy: normalizedParams.album ? 'artist-and-album' : 'artist-only',
        source: 'memory',
        imageUrl: cached.data.imageUrl,
      });
      setCover(cached.data);
      setIsLoading(false);
      setError(null);
      return;
    }

    const sessionCached = readAlbumCoverSessionCache(normalizedParams.apiUrl);
    if (sessionCached?.imageUrl) {
      console.log('[MusicLibraryAlbumCover] cache hit', {
        artist: normalizedParams.artist,
        album: normalizedParams.album,
        strategy: normalizedParams.album ? 'artist-and-album' : 'artist-only',
        source: 'session-storage',
        imageUrl: sessionCached.imageUrl,
      });
      writeAlbumCoverMemoryCache(normalizedParams.apiUrl, sessionCached);
      setCover(sessionCached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setError(null);

    console.log('[MusicLibraryAlbumCover] fetch start', {
      artist: normalizedParams.artist,
      album: normalizedParams.album,
      strategy: normalizedParams.album ? 'artist-and-album' : 'artist-only',
      apiUrl: normalizedParams.apiUrl,
    });

    loadMusicAlbumCover(normalizedParams)
      .then((data: MusicAlbumCoverResult) => {
        if (cancelled) {
          return;
        }

        console.log('[MusicLibraryAlbumCover] fetched', {
          artist: normalizedParams.artist,
          album: normalizedParams.album,
          strategy: normalizedParams.album ? 'artist-and-album' : 'artist-only',
          imageUrl: data.imageUrl,
        });

        setCover(data);
        setIsLoading(false);
      })
      .catch((fetchError: Error) => {
        if (cancelled) {
          return;
        }

        console.warn('[MusicLibraryAlbumCover] fetch failed', {
          artist: normalizedParams.artist,
          album: normalizedParams.album,
          strategy: normalizedParams.album ? 'artist-and-album' : 'artist-only',
          apiUrl: normalizedParams.apiUrl,
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

function normalizeMusicAlbumCoverParams(
  params: MusicAlbumCoverParams | null,
): (MusicAlbumCoverParams & { apiUrl: string }) | null {
  const artist = params?.artist?.trim();
  const album = params?.album?.trim();

  if (!artist) {
    return null;
  }

  const searchParams = new URLSearchParams({ artist });
  if (album) {
    searchParams.set('album', album);
  }

  return {
    artist,
    album,
    apiUrl: `/api/music-library/album-cover?${searchParams.toString()}`,
  };
}

async function loadMusicAlbumCover(params: MusicAlbumCoverParams & { apiUrl: string }): Promise<MusicAlbumCoverResult> {
  const memoryCached = albumCoverCache.get(params.apiUrl);
  if (memoryCached && memoryCached.data.imageUrl && Date.now() - memoryCached.timestamp < CACHE_TTL) {
    return memoryCached.data;
  }

  const sessionCached = readAlbumCoverSessionCache(params.apiUrl);
  if (sessionCached?.imageUrl) {
    writeAlbumCoverMemoryCache(params.apiUrl, sessionCached);
    return sessionCached;
  }

  const response = await fetch(params.apiUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch album cover');
  }

  const data = (await response.json()) as MusicAlbumCoverResult;
  writeAlbumCoverMemoryCache(params.apiUrl, data);
  writeAlbumCoverSessionCache(params.apiUrl, data);

  return data;
}

function writeAlbumCoverMemoryCache(apiUrl: string, data: MusicAlbumCoverResult): void {
  if (data.imageUrl) {
    albumCoverCache.set(apiUrl, {
      data,
      timestamp: Date.now(),
    });
    return;
  }

  albumCoverCache.delete(apiUrl);
}

function readAlbumCoverSessionCache(apiUrl: string): MusicAlbumCoverResult | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(getAlbumCoverSessionStorageKey(apiUrl));
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as {
      imageUrl?: string | null;
      timestamp?: number;
    };

    if (!parsedValue.imageUrl || typeof parsedValue.timestamp !== 'number') {
      storage.removeItem(getAlbumCoverSessionStorageKey(apiUrl));
      return null;
    }

    if (Date.now() - parsedValue.timestamp >= CACHE_TTL) {
      storage.removeItem(getAlbumCoverSessionStorageKey(apiUrl));
      return null;
    }

    return {
      imageUrl: parsedValue.imageUrl,
    };
  } catch {
    return null;
  }
}

function writeAlbumCoverSessionCache(apiUrl: string, data: MusicAlbumCoverResult): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  try {
    if (!data.imageUrl) {
      storage.removeItem(getAlbumCoverSessionStorageKey(apiUrl));
      return;
    }

    storage.setItem(
      getAlbumCoverSessionStorageKey(apiUrl),
      JSON.stringify({
        imageUrl: data.imageUrl,
        timestamp: Date.now(),
      }),
    );
  } catch {
    // Ignore storage write failures so cover loading still works.
  }
}

function getAlbumCoverSessionStorageKey(apiUrl: string): string {
  return `${SESSION_STORAGE_KEY_PREFIX}${apiUrl}`;
}

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}

function warmCoverImage(imageUrl: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const image = new window.Image();
  image.src = imageUrl;
}
