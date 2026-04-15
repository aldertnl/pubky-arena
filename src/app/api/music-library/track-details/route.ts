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
    const recordingId = searchParams.get('recordingId') ?? undefined;

    const result = await Core.MusicLibraryTrackDetailsController.fetch({ recordingId });

    return NextResponse.json(result, CACHE_HEADERS);
  } catch (error) {
    return Libs.handleApiError(error, 'api.music-library.track-details.GET', {
      unknownErrorMessage: 'Failed to fetch track details',
    });
  }
}
