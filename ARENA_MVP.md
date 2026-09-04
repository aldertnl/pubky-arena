# Pubky Arena MVP

Implemented locally on 4 September 2026 at `/arena`. Legacy `/hot` URLs permanently redirect to `/arena` and preserve query parameters.

Arena turns the existing Hot topic data into a visual, participatory leaderboard. The filter sentence supports Today’s, This week’s, This month’s, and All-time; Most popular, Most replied, Most tagged, Most reposted, and Newest; the native content filters; and From everyone, From my network, From people I follow, and From friends. This month, Most popular, Content, and My network are the signed-in reset defaults. Guests use From everyone.

Reach and timeframe select the trending topics. Selecting a topic loads the existing global tagged-post stream without filtering cards by the post’s original date, avoiding a ranked topic that opens to an empty view only because its qualifying tag events were on older or externally authored posts. Most popular scores distinct tag labels + (direct replies × 4) + (reposts × 3). Other ranking modes use their named count; Newest uses the native indexed timestamp. Muted authors and deleted posts are excluded.

Desktop Arena places up to ten compact native post cards within animated Pubky-green rings. Topic-colored rank pills, selection borders, winner badges, trophy treatment, hover states, and compact native stats communicate the competition. Grid view shows nine cards in three columns with 24px row and column gaps, falling to two columns below 1100px. Selecting a card opens its original post beside the most popular direct reply and the native reply composer.

Below 640px, Arena always uses the single-column grid and hides the view selector and the introductory “Show” copy. The filter rows use 12px vertical spacing, and “Reset defaults” shortens to “Reset.” Topic labels show up to 14 characters before an ellipsis. Topic pills inside the picker have rounded corners on all sides.

The implementation reuses the existing Pubky shell, filters, `PostTag`, `PostMain`, `QuickReply`, stores, Nexus services, and post streams. It adds no package or backend dependency. “How ranking works” discloses the topic scope, candidate loading, scoring, reply behavior, and cached-count limits in the interface.

## Local state

- Branch: `vibe/arena-mvp`
- Upstream: `https://github.com/pubky/pubky-app.git`
- Base repository: `pubky/pubky-app`
- Base commit: `8a7b79f0dc01cb63d1c0ab6b944c420142318d00`
- Runtime target: production
- No commit, fork push, deployment, or Vibes registry submission has been made.

## Run

```sh
cd /Users/aldert/Projects/Arena/app
npm ci
npm run dev -- --port 3003
```

## Main entry points

- `src/app/arena/page.tsx`
- `src/components/templates/Feed/Hot/Hot.tsx`
- `src/components/organisms/Arena/`
- `src/hooks/useArenaIdeas/`
- `src/libs/arena/`

## Release boundary

The official Pubky Vibes self-host flow requires a public developer-owned `pubky-app` fork, a pushed vibe branch, a public HTTPS deployment, and a separate `registry/arena/` entry in `pubky/vibes`. The maker display name, 52-character Pubky, fork URL, and final hosted URL must be confirmed before the listing manifest can validate. Git signing, pushing, deployment, and registry submission remain user-approved release steps.
