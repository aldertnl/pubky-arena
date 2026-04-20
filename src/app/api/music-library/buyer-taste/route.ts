import { NextResponse } from 'next/server';
import * as Core from '@/core';
import * as Libs from '@/libs';
import { generateAdId } from './ad-token';

const TARGET_PUBKEYS = [
  '8mmmaouyode95qf7scbt4moytceiga4we5i3fwra71xapmwguwdy',
  '4pjawer14xpnaer8jt1tw4u611rrr6co3uzgdq5tsa4n1my4333y',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:3001',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET() {
  try {
    const secret = 'hackathon-demo-secret-2026';

    const records = await Promise.all(
      TARGET_PUBKEYS.map(async (pubky) => {
        try {
          const settingsUrl = Core.SettingsNormalizer.buildUrl(pubky);
          const settingsJson = await Core.HomeserverService.request<Core.SettingsJsonInput>({
            method: Libs.HttpMethod.GET,
            url: settingsUrl,
          });

          if (!settingsJson) return null;

          const settings = Core.SettingsNormalizer.from(settingsJson);
          if (!settings.privacy.musicLibraryBuyerSharingEnabled) return null;

          const libraryUrl = Core.MusicLibraryNormalizer.buildUrl(pubky);
          const libraryJson = await Core.HomeserverService.request<Core.MusicLibraryDocumentInput>({
            method: Libs.HttpMethod.GET,
            url: libraryUrl,
          });

          if (!libraryJson) return null;

          const document = Core.MusicLibraryNormalizer.fromDocument(libraryJson);
          const tasteRecord = Core.MusicLibraryNormalizer.toBuyerTasteRecord({ pubky, document });
          const { pubky: _removed, ...rest } = tasteRecord;

          return { adId: generateAdId(pubky, secret), ...rest };
        } catch {
          return null;
        }
      }),
    );

    return NextResponse.json({ records: records.filter(Boolean) }, { headers: CORS_HEADERS });
  } catch (error) {
    return Libs.handleApiError(error, 'api.music-library.buyer-taste.GET', {
      unknownErrorMessage: 'Failed to fetch buyer taste records',
    });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}
