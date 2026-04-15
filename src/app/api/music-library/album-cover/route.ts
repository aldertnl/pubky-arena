import { NextRequest, NextResponse } from 'next/server';
import * as Core from '@/core';
import * as Libs from '@/libs';

const CACHE_HEADERS = {
  headers: {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artist = searchParams.get('artist') ?? undefined;
    const album = searchParams.get('album') ?? undefined;

    const cover = await Core.MusicLibraryAlbumCoverController.fetch({ artist, album });

    return NextResponse.json(cover, CACHE_HEADERS);
  } catch (error) {
    return Libs.handleApiError(error, 'api.music-library.album-cover.GET', {
      unknownErrorMessage: 'Failed to fetch album cover',
    });
  }
}
