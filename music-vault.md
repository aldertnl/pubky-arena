# Music Vault / Music Library Dev Plan

## Goal
This document reflects the current implementation status of the hackathon `Music Library` feature.

- The current user-facing UI name is `Music Library`
- The working name for planning and presentation is `Music Vault`
- To keep the main profile UX stable, the feature is introduced inside `Experiments` first

This document summarizes what is already implemented, which contracts are real in the codebase today, and what still remains.

## Implementation Principles
- `homeserver` remains the source of truth
- `localStorage` is used as a cache for read performance and draft recovery
- Marketing and advertising use is allowed only after `settings.privacy.musicLibraryConsent` is enabled
- Buyer sharing requires `settings.privacy.musicLibraryBuyerSharingEnabled` to be enabled separately
- Music data is stored as an app-specific custom document rather than a standard `pubky-app-specs` entity
- The image strategy is centered on album covers, and the current implementation uses a MusicBrainz-based lookup flow

## Current Status Summary

### Completed
- Profile `Experiments` entry point
- Desktop filter bar and mobile menu visibility rules
- Own-profile-only access control and redirect behavior for other users
- `Music Library` screen inside the `Experiments` page
- Add flow, draft save/restore, list read, and delete flow
- `track-autocomplete`, `track-details`, and `album-cover` APIs
- `homeserver` persistence plus `localStorage` caching
- Consent UI wired into settings
- `Music Snapshot` calculation and profile display
- Initial buyer taste API
- A solid set of unit and UI tests

### Remaining
- Connect item editing to the UI
- Build a buyer demo screen
- Strengthen buyer token security
- Store a consent timestamp
- Align summary visibility rules across desktop and mobile profile views

## Phase 1. Add an Experiments Entry in Profile

### Current State
The following pieces are already implemented.

- `PROFILE_PAGE_TYPES.EXPERIMENTS`
- `PROFILE_ROUTES.EXPERIMENTS`
- An `EXPERIMENTS` mapping in `useProfileNavigation`
- `ownProfileOnly: true`
- Redirect behavior that sends other users back to posts when they try to access `Experiments`

### Actual Behavior
- The `Experiment` tab is visible only on your own profile
- Desktop filter bar and mobile menu follow the same visibility policy
- `src/app/profile/[pubky]/experiments/page.tsx` blocks direct access and redirects to `/profile/{pubky}/posts`

## Phase 2. Build the Music Library Page Inside Experiments

### Current State
The actual hackathon entry screen is implemented in `src/app/profile/(own)/experiments/page.tsx`.

### Current UI Structure
- An `Experiments` intro card
- A `Music Snapshot Sidebar` toggle
- A saved `Music Library` list
- A music add form
- A consent section

### Notes
- The sidebar toggle is wired to `privacy.showMusicLibraryProfileSummary`
- The screen keeps the experimental feel while already supporting real save, delete, and consent flows

## Phase 3. Music Library Form and List

### Form Status
`MusicLibraryForm` now auto-fills more metadata than the original plan described.

Current behavior:
- The search input uses `track-autocomplete`
- Selecting a result fills `recordingId`, `track`, `artist`, `album`, and `year`
- It then calls `track-details` to enrich `artist`, `album`, `year`, and `genre`
- The user only needs to choose a `rating` before saving
- `Add Item` is enabled only after a `recordingId` has been selected
- Draft reset is implemented

So the form is no longer in the earlier "fill only track first, wire artist and album later" stage. It now combines search results with a details lookup to populate richer metadata.

### List Status
`MusicLibraryList` currently provides:

- Saved item rendering
- Album cover rendering for each item
- A refresh action
- A delete action

Current MVP feature set:
- create
- read
- delete

Still not connected:
- edit UI

## Phase 4. Music Library Domain Foundation

### Core Types
The following types are defined in `src/core/pipes/music-library/music-library.normalizer.ts`.

- `MusicLibraryItem`
- `MusicLibraryDocument`
- `MusicLibraryDraft`
- `BuyerTasteRecord`
- `MusicLibraryProfileSummary`

### Homeserver Document Contract
The current implementation uses a single JSON document contract.

- Path constant: `pub/pubky.app/music-library.json`
- URL builder: `MusicLibraryNormalizer.buildUrl(pubky)`
- Document shape: `version`, `updatedAt`, `items`

### Storage Model
- Each user has a single `music-library.json` document
- The app reads the whole document, updates items in memory, then writes the whole document back
- For the current hackathon scope, there is no separate item-level endpoint

### Draft and Normalizer Rules
- The draft default comes from `MusicLibraryNormalizer.createEmptyDraft()`
- The empty document default comes from `MusicLibraryNormalizer.createEmptyDocument()`
- `itemFromDraft()` performs required-field and numeric validation
- `toBuyerTasteRecord()` and `toProfileSummary()` generate external summary shapes

## Phase 5. Cache / Application / Controller

### Cache Service
The local cache is implemented in `src/core/services/local/music-library-cache/music-library-cache.ts`.

Current keys:
- `music-library-cache`
- `music-library-draft`

### Application Layer
`MusicLibraryApplication` currently handles:

- Cache-first reads
- `homeserver` GET and PUT
- Cache updates after successful writes
- Draft save, restore, and clear operations

Important documentation note:
- The original plan said `GET 404` should be restored as an empty document
- In the current code, the application layer can return `null`, and the controller and hook layers interpret that as an empty library state
- So the most accurate documentation wording today is that the UI treats missing remote data as an empty library

### Controller Layer
`MusicLibraryController` exposes:

- `getOrFetchMusicLibrary`
- `getOrFetchMusicLibraryByPubky`
- `fetchMusicLibrary`
- `commitCreateMusicItem`
- `commitDeleteMusicItem`
- `commitUpdateMusicItem`
- draft-related methods

The UI currently uses `create` and `delete`, while `update` is not yet wired into the screen.

## Phase 6. Consent / Settings

### Current Settings Fields
The real privacy fields are:

- `showMusicLibraryProfileSummary`
- `musicLibraryConsent`
- `musicLibraryBuyerSharingEnabled`

The earlier `musicLibraryVisibility` idea does not exist in the current implementation. Instead, summary visibility is controlled by `showMusicLibraryProfileSummary`.

### Current Consent UI
`MusicLibraryConsent` provides:

- Consent for marketing and recommendation use
- A buyer sharing toggle
- Buyer sharing can only be enabled when base consent is enabled
- Users can change these settings directly inside the experiment screen

### Documentation Notes
- Buyer sharing is a separate toggle, but it is effectively downstream of consent
- The policy that revoking consent should stop downstream use still holds

## Phase 7. Profile Summary Integration

### Current Summary Contract
The direction remains the same: show a summary card instead of the full library on the public-facing profile area.

Current rules:
- Uses `MusicLibraryNormalizer.toProfileSummary()`
- `topArtists` is capped at 5
- Includes `totalItems` and `updatedAt`
- Groups by artist and picks a representative item to expose `artist`, `album`, and `track`

### Current Display Locations
- On the desktop profile sidebar, it shows only when `privacy.showMusicLibraryProfileSummary === true`
- On the mobile profile view, the visibility behavior may still need cleanup to match desktop exactly

### Open Decisions
- Whether desktop and mobile should use exactly the same visibility rule
- Whether summary visibility should be tied more strongly to consent

## Phase 8. Buyer Taste API

### Goal
Provide an API for a marketing app at `http://localhost:3001` so it can read music taste summary data for users who have buyer sharing enabled.

### Current Implementation
`GET /api/music-library/buyer-taste` already exists.

Current flow:
1. Iterate over two hardcoded pubkys
2. Publicly fetch each user's settings
3. Skip users where `musicLibraryBuyerSharingEnabled !== true`
4. Fetch `music-library.json`
5. Build a taste record through `MusicLibraryNormalizer.toBuyerTasteRecord()`
6. Remove `pubky` from the response and replace it with `adId`

### Current Response Shape
```json
{
  "records": [
    {
      "adId": "hashed_token",
      "topGenres": ["Rock", "Jazz", "Pop"],
      "topArtists": ["Artist A", "Artist B", "Artist C"],
      "favoriteTracks": [
        { "artist": "X", "track": "Y" }
      ],
      "consentGrantedAt": null
    }
  ]
}
```

### Difference From the Original Plan
Unlike the original design, the current token implementation does not use AES-256-GCM encryption.

Current implementation:
- `generateAdId(pubky, secret)` -> HMAC-SHA256 hex
- `resolveAdId(adId, pubkyList, secret)` -> reverse lookup by hashing candidate pubkys again
- The secret is currently an inline demo string inside the route rather than an environment variable

So `adId` is currently closer to a deterministic demo hash identifier than a decryptable opaque token.

### Current CORS Policy
- `Access-Control-Allow-Origin: http://localhost:3001`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

### Follow-up Work
- Move the secret into `AD_TOKEN_SECRET`
- Upgrade to AES-GCM or another stronger signed/encrypted token scheme if needed
- Persist a consent timestamp in settings or related metadata

## Phase 9. Additional APIs

Compared with the original draft, these APIs already exist as well.

- `GET /api/music-library/album-cover`
- `GET /api/music-library/track-autocomplete`
- `GET /api/music-library/track-details`

These APIs are important because they materially improve the `MusicLibraryForm` and `MusicLibraryList` experience.

## Test Status

Examples of the current test coverage:
- `album-cover` route test
- `track-autocomplete` route test
- `experiments/page` test
- `MusicLibraryConsent` test
- `MusicLibraryForm` test
- `MusicLibraryList` test
- `useMusicLibrary` test
- `useMusicTrackAutocomplete` test
- `music-library` application, cache, and normalizer tests
- profile navigation, filter bar, mobile menu, and sidebar tests

This feature is no longer just a loose prototype. The main flows already have a meaningful amount of regression protection.

## Highest-Priority Remaining Work

1. Wire `MusicLibrary` item editing into the real UI
2. Add a buyer demo page or a `hackathon/buyer`-style screen
3. Move the buyer token secret into an environment variable
4. Persist `consentGrantedAt` and include it in the buyer payload
5. Clean up summary visibility rules across desktop and mobile profile views
6. Remove old placeholder copy still left inside `MusicLibraryList`

## Current Demo Flow

1. Open the `Experiment` tab on your own profile
2. Search for a song in `Music Library`
3. Select an autocomplete result and confirm metadata is auto-filled
4. Choose a rating and save the item
5. Refresh and verify cache or `homeserver` reload behavior
6. Turn on `Music Snapshot Sidebar`
7. Enable consent and buyer sharing
8. Verify the buyer record through `GET /api/music-library/buyer-taste`

## Notes

- Keeping `Music Library` as the user-facing label is the safest choice for UI consistency
- `Music Vault` works well as a subtitle or presentation-facing feature name
- The buyer API security model is still hackathon-grade and should be strengthened before any production use
