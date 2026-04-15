import { NextRequest, NextResponse } from 'next/server';
import * as Core from '@/core';
import * as Libs from '@/libs';

const CACHE_HEADERS = {
  headers: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') ?? undefined;

    const result = await Core.MusicLibraryTrackAutocompleteController.fetch({ query });

    return NextResponse.json(result, CACHE_HEADERS);
  } catch (error) {
    return Libs.handleApiError(error, 'api.music-library.track-autocomplete.GET', {
      unknownErrorMessage: 'Failed to fetch music suggestions',
    });
  }
}
