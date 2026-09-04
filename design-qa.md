# Arena design QA

Date: 4 September 2026.

## Final pre-release review — 4 September 2026

Reviewed the current `/arena` implementation against the latest requested behavior and the official Pubky Vibes self-host guide. Fixed the unsupported “From me” reach option, which previously mapped to the unfiltered Everyone request; the available choices now map directly to Nexus reach values. Removed stale Collections “NEW” tests after the indicator’s intentional removal and refreshed the Arena navigation icon snapshots.

Live desktop QA covered topic selection, Arena and three-column Grid, card selection, the original/leading-reply reader, and filter menus. Grid rendered nine cards with measured 24px row and column gaps. Live 390px QA confirmed no horizontal overflow. The final mobile follow-up fixes the single-column grid as the only view, hides “Show” and the view selector, adds 12px filter-row spacing, and shortens the reset label to “Reset.” The last quick visual tweaks increase topic truncation to 14 characters and give picker tags four rounded corners; tests were intentionally skipped for those two user-requested quick fixes.

Validation: the focused Arena/shared-surface run passed 9 files and 124 tests; the isolated shared PostText/PostMain/QuickReply run passed 266 tests; Header passed 51 tests and MobileFooter passed 36 tests with updated snapshots. TypeScript, targeted ESLint, whitespace checks, and the production build passed. A broad concurrent unit run produced timeout-only failures under local resource contention; every affected Arena and shared test passed when run in focused or isolated groups. The initial sandboxed build could not resolve Google Fonts; the network-enabled rerun compiled, typechecked, generated all routes including `/arena`, and exited successfully.

No authenticated write, commit, push, deployment, or registry submission was performed. The unpublished listing draft and supplied cover are under `../listing/arena/`.

## Latest optimization QA — 4 September 2026

This section supersedes the historical UI descriptions below. Source of truth: the user’s latest requests and the current native Pubky components. Review target: the local Arena implementation with real staging data, plus deterministic browser fixtures. Its canonical route is now `/arena`; historical `/hot` captures predate that rename. No production deployment or authenticated write was performed.

### Findings and fixes

- **Resolved P2 — unreadable phone and tablet cards.** The circular transforms compressed phone cards to roughly 67–117px. At widths up to 900px, Arena now uses full-size cards in two columns, with one column below 640px. The conversation reader stacks below 1024px. Desktop keeps the requested circular order, 5% size steps, rotations, and rank stacking.
- **Resolved P2 — clipped selected topics and horizontal overflow.** Removed the inherited desktop clipping from the Hot content wrapper, anchored side topics inside the stage, and confined only the decorative rings to their drawing area. Selectable tags, cards, and shadows retain visible overflow. Live document width equals viewport width at 375, 390, 768, 1024, and 1440px.
- **Resolved P2 — repeated topic rank numbers.** Topic badges now use unique sequential positions in the endpoint’s supplied order. Post standings already break equal scores into stable unique positions; the lead message still acknowledges ties.
- **Resolved P2 — incomplete ranking explanation.** “How ranking works” documents the weighted popularity formula of distinct tags + (replies × 4) + (reposts × 3); rolling windows; lifetime counts; loaded-candidate scope; stable ties; cached counts; and independent direct-reply ranking across all fetched reply pages. It explains that replies need not match the topic or reach and that “Show all replies” opens the standard thread.
- **Existing platform limit — 320px.** Pubky’s global stylesheet sets a 375px minimum body width. A 320px viewport therefore scrolls horizontally. This was reproduced and left as an app-wide constraint; Arena fits the existing 375px minimum. No blanket global sizing override was introduced.

### Reviewed journey

1. **Discover and filter — healthy at supported widths.** Native menus wrap without losing the sentence order; timeframe and reach semantics match their data requests. The tag now opens the native tag-entry popover, superseding the earlier search link. Menu order and Newest behavior are covered in browser tests.
2. **Compare and select — healthy.** Desktop preserves the playful circular composition. Phone/tablet grids retain ranks and readable cards. Arena/List switching preserves selection; List exposes the full eligible loaded set. The ninth/tenth positions retain the requested smaller desktop scale.
3. **Read and continue — healthy.** The original and independently ranked leading direct reply render through native PostMain. Clicking the original card opens its regular thread page using native post navigation. Tags precede the left-aligned actions. The secondary “Show all X replies” link follows the leading reply and opens the standard thread using the original post’s total count. The composer follows under “JOIN THE BATTLE” and uses “Reply to original post”. Avatar-aligned connectors branch from the original post to the leading reply and composer, replacing the column divider and moving to the left gutter when stacked.
4. **Keyboard and access — checked for the principal controls.** Enter opens ranking and focuses the first item; ArrowDown moves between items; Enter chooses; Escape closes and returns focus to the trigger. Guest My network opens the native authentication prompt. No signed-in mutation was attempted.
5. **Motion — rendered and inspected.** Nine decorative rings have the intended varied opacity/blur and changing transforms between samples. They remain outside the accessibility tree. Existing reduced-motion rules were reviewed; OS preference switching and frame-rate profiling were not performed.

### Current-run visual evidence

Captures are under `../planning/qa/final-ui/`, using the in-app browser, dark theme, guest All reach, Most popular, This month, and pubky unless otherwise noted. Pixel dimensions match the requested CSS viewport for the live captures. Staging content and counts can change between captures.

- `01-before-desktop.png` and `07-after-desktop.png`: 1440 × 1000; selected side topic clipping before/after.
- `02-before-mobile.png` and `04-after-mobile.png`: 390 × 844; compressed circular cards versus readable single-column cards. These exact files were opened together for comparison.
- `03-before-tablet.png` and `10-after-tablet.png`: 768 × 1024; circular crowding versus two-column cards.
- `05-list-mobile.png`, `06-network-auth-mobile.png`: 390 × 844; List and guest auth behavior.
- `08-conversation-desktop.png`, `09-standard-thread.png`: 1440 × 1000; native reader and actual thread navigation.
- `11-narrow-menu.png`: 320 × 740; evidence of the shared 375px shell limit.
- `12-small-phone.png`: 375 × 812; supported minimum layout and native focus ring.
- `13-small-desktop.png`: 1024 × 900; circular composition at the small desktop boundary.
- `14-ranking-explanation.png`: 1440 × 1000; expanded disclosure and reader.

Some live captures include the Next.js development build indicator; this is development chrome. The final browser warning/error query returned an empty list. VRT baselines use fixture avatars/content and frozen animation, so they supplement rather than replace the live composition review. Chromium/WebKit desktop and Firefox mobile baselines were opened and inspected. The harness scales captures to its output frame; live captures establish actual typography sizing.

### Verification and limits

Focused ranking, projection, reply-pagination, native action, store, and shell tests passed: 55 tests across eight files. TypeScript passed. The initial baseline regeneration completed 264 cases across three engines; unrelated regenerated screenshots were restored to their pre-QA state. Only Arena baselines are part of this change.

Final QA static checks passed (TypeScript, targeted ESLint, and whitespace). The final screenshot comparison did not complete: the Firefox browser session failed to connect before its timeout. It is not reported as a passing comparison. Subsequent user-requested UI tweaks are listed below and intentionally do not trigger another full browser cycle. New regression checks cover 375/900/1024px bounds and full-size compact layouts, plus native leading-reply rendering and the standard thread href. An initially ambiguous reply-text assertion was scoped to the Replies region; it had matched both a mini card and the reader. Firefox also hit screenshot-stability timeouts during the busy run; the final comparison was blocked by the browser-session timeout.

Remaining release checks: authenticated staging tag/reply/repost writes, exhaustive empty/error/light-theme states, assistive-technology review, and actual OS reduced-motion switching. Ranking is still over the loaded post pool (initial request 24), not a global leaderboard; the visible explanation now states that limitation. A production build was not rerun for this final CSS/copy pass.

## Tweaks after the QA pass

- The leader uses two left-aligned badges on opposite edges of its card. The green top badge reads trophy, #1, the selected topic, and the active content-filter label; the muted bottom badge reads “LEADING BY X POINTS”. All content renders as “CONTENT”, while narrower filters use their selector labels.
- Selected Arena tags use their deterministic tag color for both the fully opaque border and 16% outer glow without changing their rank-based size. Selected content uses a 32% Pubky-green outline and 16% outer glow while keeping its existing black drop shadow. The same tag border and glow styling applies in the top-tags popover. A 1px divider using the subtle native border color shared by connector lines sits below the selector row. Topic chips scale from 100% at #10 to 145% at #1 and receive subtle randomized rotations when the active filter scope changes. At the maximum container width, the original post matches the feed’s 792px column and the reply column fills the remaining 360px; the reader stacks below 1024px.
- Moved the canonical page to `/arena` and updated shared navigation, labels, and public-route access checks. `/hot` now returns a permanent HTTP 308 redirect to `/arena`, preserving query parameters. Live HTTP checks confirmed the redirect and a successful 200 response from `/arena`; the browser followed `/hot` to `/arena` and rendered the filters, standings, and both Arena navigation links. All 197 focused routing, access, and navigation tests passed; six navigation snapshots were refreshed, including the already-selected Radar icon. The first development compile was slow, and obsolete generated `/hot` types were removed before regenerating route types. Full browser visual baselines remain deferred.
- Route rename verification also passed TypeScript after regenerating route types, targeted source ESLint, and whitespace checks.
- Replaced the native logo asset with the supplied `public/pubky-arena-logo.svg`, preserving its aspect ratio at 36px high.
- Kept the winning topic badge at its standard size. Topic chips are sized by rank from 100% at #10 to 145% at #1, independent of selection, and receive subtle randomized rotations whenever the filter scope changes.
- Replaced the sentence’s “posts” text with a content-type dropdown. “Content” means All; the remaining options and icons come from the same shared metadata as the native feed content filter. The selected type changes the actual candidate stream.
- Added a tag-entry popover to the entire colored tag, with a dropdown arrow. It no longer navigates to search. Valid input can select any tag; selecting a top-ten topic replaces that input. Native tag validation, ControlledInputField, Popover, Button, react-hook-form, and zod are reused. The menu shows “TOP #10 TAGS [TIMEFRAME]” above ten native tags with 8px wrapping gaps. A tag click applies it directly; the empty, focused “custom tag” input below submits on Enter, with no Set tag button.
- Aligned the two leader badges with the avatar’s left edge. Other metrics use their relevant unit; ties say “TIED FOR LEAD”. Removed the separate arena lead box.

Focused logo, content-filter, and initial tag-input tests passed (49 tests; three logo snapshots updated). The 20 ranking and card tests also passed. The initial ControlledInputField test run timed out during the slow local run. The latest three focused tag-picker tests passed, including initial focus, empty input, Enter submission, validation, the top-ten limit, timeframe labeling, and direct tag selection. The final input was verified live by setting a custom tag, switching content type, and replacing the custom tag through a top-ten topic. Final TypeScript and targeted ESLint checks passed. Topic hover now scales the tag by 10% instead of translating it upwards. Browser baselines now precede these additional tweaks and require regeneration at the next full visual gate.

The local development server needed a restart after HMR stopped refreshing reliably. Subsequent development compilation stalled requests for several minutes. The user-facing preview recovered after compilation finished: `/hot` returned HTTP 200, the controls and posts rendered, and the browser error/warning check was empty. `../planning/qa/final-ui/15-preview-restored.png` records the latest UI in the user preview at its existing viewport with stacker.news selected. The server remains running on port 3003.

Reply-section follow-up: 36 focused ArenaConversation and QuickReply tests passed, covering total-count thread navigation, section order, original-post targeting, the custom placeholder, optional connector removal, and existing default composer behavior.

Latest tag menu browser check: ten tags, computed 8px gaps and flex wrapping, empty focused custom-tag input, no Set tag button. Enter selected bitcoin and closed the menu. Screenshot: `../planning/qa/final-ui/17-top-tags-dropdown.png`.

Particle follow-up: 24 decorative green dots use stable seeded placement, varied sizes, 4–10px blur, and base opacities from 10–65%. CSS-only transform/opacity animation traces wider, staggered floating paths with up to 90px horizontal and 144px vertical travel. They sit inside the existing clipped, noninteractive bowl behind cards and tags, are hidden in List view, and respect reduced motion. Visual baselines still require regeneration after the current UI tweaks.

Card rotations now receive a fresh ±1.5° variation after each tag, filter, or view change and on a new page load, including the center winner. Random values are generated after hydration and remain stable during card selection and count updates. List and compact layouts retain their unrotated presentation. The VRT fixture fixes the random source for reproducible future captures. The reply composer label is now “JOIN THE BATTLE”.

Validation for the particle, rotation, and label follow-up: all 12 focused floor/conversation tests and targeted ESLint passed. The added rotation check covers fresh variation after filter changes, stable selection, and a level center card. Live preview confirmation was blocked by browser navigation timeouts and a closed preview target, so no new rendered screenshot or issue-indicator fix is claimed. The development log contained a React update-before-mount warning without a component stack; its source was not established during this check.

Conversation connector follow-up: removed the full-height column divider. Measured SVG paths connect the original post to the leading reply and JOIN THE BATTLE composer at their avatar centers, updating after native content loads or resizes. They use the native border color, remain behind cards, and do not intercept interaction. Live checks at 1280px and 390px confirmed desktop alignment, stacked left-gutter routing, and no horizontal overflow. Screenshots: `../planning/qa/final-ui/19-conversation-connectors-desktop.png` and `../planning/qa/final-ui/20-conversation-connectors-mobile.png`. All six existing ArenaConversation tests and targeted ESLint passed. Full visual baselines remain deferred.

## Historical iteration notes

The following sections record earlier iterations and may describe superseded controls or counts.

## Findings

No remaining actionable P0/P1/P2 visual findings in the reviewed MVP states.

Resolved P2: the selected upper-left idea outline overlapped the left perimeter topic tag. Evidence: `../planning/qa/desktop-conversation.png`. The floor now occupies 76% of the stage, the upper-left node is inset 3%, and side topic groups are capped at 150px on desktop. The native tag component truncates long labels. Medium/mobile layouts reset those caps. The revised selected-node screenshot and a DOM bounds assertion pass in Chromium, Firefox, and WebKit.

## Source and comparison evidence

Source visual truth: `../planning/options/option-3-competitive.png` (1487 × 1058 pixels), plus the user's subsequent instructions to use icon-and-number statistics and reuse Pubky's standard colored tags and other components.

Implementation: `http://localhost:3003/hot`.

Live implementation captures:

- `../planning/qa/desktop-topics.png`: 1487 × 1058 pixels, 1487 × 1058 CSS viewport, effective 1 pixel per CSS pixel; logged out, staging, dark theme, 7 days, ai, Most tagged, topic view.
- `../planning/qa/desktop-conversation.png`: same dimensions and density; original vs. replies, SHAcollision selected, Corey Phillips leading.
- `../planning/qa/mobile-arena.png`: 390 × 844 pixels and CSS viewport, effective 1 pixel per CSS pixel; staging, dark theme, 7 days, ai, Most tagged.

Source and live captures were opened together in the same comparison input. They share the desktop viewport and theme. The source uses illustrative signed-in pubky data; the implementation uses real logged-out staging ai data. Author photos, counts, sparse conversations, and the auth controls therefore differ intentionally. This is composition and component fidelity review, not a pixel-equivalence claim about different content.

Post-fix evidence: `src/test/vrt/feed/__screenshots__/Hot.vrt.test.tsx/hot-selected-side-chromium-darwin.png`, with Firefox and WebKit siblings. Requested CSS viewport: 1487 × 1058. The existing VRT harness produced a uniformly scaled 1012 × 720 image. That capture is supplementary spacing/state evidence, not a source for judging raw font pixel sizes. The selected-node gap is additionally checked against DOM bounding rectangles in CSS coordinates. This uses deterministic Pubky fixtures, Most tagged, and a selected upper-left contender; it does not claim a new live staging capture after the Mac locked.

Full-view comparisons: the selected visual, live desktop topic view, live conversation view, and mobile adaptation were examined together. The final selected-side VRT image was then compared with the same source. The native-resolution live captures make text, tag colors, ranks, avatars, and icon/count pairs readable, so no separate focused crop was needed. The final regression isolates the selected side node and adjacent tag through its bounding-rectangle assertion.

## Required fidelity surfaces

| Surface              | Assessment                                                                                                                                                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fonts and typography | Native Inter Tight, native control weights, readable rank and metric hierarchy, two-line node previews. Long topic labels truncate using the existing tag behavior. Native controls are more compact than the generated mock, as explicitly requested.                           |
| Spacing and layout   | Elliptical overview, topic perimeter, ranked idea floor, and two-column reader preserve the chosen composition. Page width and header use the real Pubky shell. The selected-node/tag collision is fixed. At 390px the topic grid and stacked reader remain within the viewport. |
| Colors and tokens    | Existing background, border, foreground, and brand tokens. Topic colors come from native PostTag label-color generation. Lime indicates a leader; a separate outline indicates the selected node. Zero-score nodes do not receive a winner highlight.                            |
| Images and icons     | Native Pubky logo and navigation, real staging author images, existing avatar fallbacks, stock Lucide icons. No generated mock portraits enter the product. The ellipse is the agreed interactive data-stage geometry rather than a raster stadium illustration.                 |
| Copy and content     | Visible timeframe describes posts tagged in the window. Standings explicitly disclose loaded scope and all-time counts. Stats use icons plus numbers. Original, reply, selected reply, leading reply, and shared-rank labels follow actual relationships/scores.                 |

## Comparison history

1. Initial implementation review: topic controls used bespoke chips, and native reader tag counts showed distinct labels while standings used applications. The final implementation uses the native distinct-label count in both places, including Most popular scoring. Replaced chips with PostTag plus an optional post-count icon and retained the native action bar presentation.
2. Final desktop review: the selected upper-left outline crossed a perimeter tag. Applied the spacing fix described above. Added a selected-side browser regression. All three engines pass, and the post-fix image visibly separates the node from the topic. Re-ran desktop/mobile baselines after the CSS change.

## Interactions and remaining verification gaps

Verified live: timeframe changes, Most tagged/Most replied switching, List showing the loaded pool, returning to Arena, original/reply comparison, choosing another reply and seeing the reader update, and the native logged-out Following auth dialog. Desktop and mobile document widths matched their CSS viewports without horizontal overflow. Automated tests cover competition ties, parent checks, muted/deleted/content-warning projections, icon-stat accessible names, selection, and the native default/action-count override.

The live console inspection found an early author-projection error; it was fixed by parsing the composite post ID. Subsequent browsing worked and the projection tests and production build passed. A fresh final live console sweep could not be performed after the Mac locked. No authenticated write, full keyboard sweep, or exhaustive empty/error/light-theme audit is claimed. Load-more is wired through existing pagination but was not exercised against live staging during manual QA.

## Accepted scope differences and follow-up polish

The native header and cards replace the generated mock's invented equivalents, per the user's explicit instruction. The reader starts lower with the real header and comparison controls and can contain tall native media. Mobile uses a scrollable grid rather than shrinking all nodes onto one screen. Generated zoom/fullscreen controls, decorative graph links, timestamps on nodes, and simulated momentum are outside this first MVP. No fabricated data fills sparse conversations.

Follow-up P3: richer compact previews for long posts/collections and a later decision about explicit reply links could improve scanning. These do not block the implemented browse/select/compare experience.

## Implementation checklist

- [x] Use the selected ellipse composition with standard Pubky components.
- [x] Use colored native tags and icon-and-number statistics.
- [x] Keep selection distinguishable from the lead.
- [x] Make timeframe and leaderboard scope explicit.
- [x] Resolve the perimeter overlap and verify it in three engines.
- [x] Compare desktop/mobile rendered evidence with the source.
- [ ] Perform authenticated staging tag/reply smoke tests before public release.

## Motion and responsive refinement — follow-up review

The user requested continued UI analysis and subtle animations. The selected option-3 composition and native Pubky components remain the design target. This follow-up uses fresh browser evidence under `../planning/qa/motion/`.

### Findings and fixes

- **Resolved P2 — tablet stats covered by the lead indicator.** At 768px, fixed absolute node positions exceeded the floor's fixed height. Reproducing the old placement showed the lower node ending around 777px while its floor ended around 732px. Content-sized grid rows now contain every node; the final floor and lowest node both end at 790.78px, with the lead indicator below. The ranking is still spatial, with the leader centered. A browser bounds assertion covers this in all three engines.
- **Resolved P2 — ranking changes were abrupt.** Stable keyed nodes now use the existing Motion library's position transitions. A live sample showed two retained ideas moving with opposite `translate3d` offsets after the metric changed. A settled sample showed zero moving nodes and opacity 1 for every visible node. Selection and keyboard focus survive reordering, verified by a component test.
- **Resolved P3 — coarse interaction feedback.** Added a 2px pointer-hover lift, 1px press response, short border/glow transitions, a 240ms staggered entrance, and 180–240ms count/content fades. The rim reveals once over 900ms. Hover shading was reduced to a restrained token-based tint after visual review. There is no recurring decorative animation or synthetic count increment.
- **Resolved P3 — weak previews and distant pagination.** The existing `deriveTextPreview` helper now supplies article titles and collection names. “Load more” sits beside the count summary, avoiding the floating post button in the captured tablet state.

### Evidence and comparison

- Source: `../planning/options/option-3-competitive.png`, 1487 × 1058; composition only where later user instructions require native Pubky controls and real data.
- `motion/07-after-desktop.png`: 1487 × 1058 CSS/pixels, logged out, dark, staging, ai, 7 days, Most tagged.
- `motion/03-tablet-reproduction.png` and `motion/05-after-tablet.png`: both 768 × 1024 CSS/pixels, same staging topic/window, Most replied. The reproduction temporarily reinstated the old tablet positioning rules only; those rules were removed immediately afterward and the final stylesheet restored. It includes the improved title helper, so it is labeled as a reproduction, not an untouched historical screenshot.
- `motion/10-after-mobile.png`: 390 × 844 CSS/pixels, ai, 7 days, Most replied.
- `motion/08-after-list.png`: 1487 × 1058 CSS/pixels; 24 rows present in the DOM, same selected idea as Arena.
- `motion/09-after-conversation.png`: 1487 × 1058 CSS/pixels; Original vs. replies with SHAcollision selected and the matching reader content.

The source and final desktop capture were reviewed together, as were the old tablet-placement reproduction and the fixed tablet capture. The tablet pair was opened at original size in one comparison input; no density normalization was needed. Full images clearly show the fonts, icons, tag chips, leader/selection distinction, and lower-node statistics, so a separate focused crop was unnecessary. The bounds checks supplement the visible spacing comparison. The initial `01-before-desktop.png` and `03-before-tablet.png` saves raced viewport resizing and are excluded from pixel comparison; the accepted captures above replace them as evidence.

The five fidelity surfaces were reviewed: Inter Tight and native typography remain intact; grid rows resolve the spacing collision; colors remain native tokens with restrained hover tint; native logos, avatars and Lucide icons stay sharp; and metric copy still distinguishes windowed topics from all-time loaded idea standings. The mobile view scrolls normally without horizontal overflow. The full selected-reply card remains the native component.

### Verified steps

1. **Browse and change rankings — passed.** Ideas move into their new places, new arrivals fade in briefly, and the effect settles. A same-node test verifies focus and selection continuity.
2. **Switch Arena/List — passed.** The selected idea remains selected, with all 24 loaded rows available in List.
3. **Open comparison and select a reply — passed.** The actual original and its replies are shown; selecting SHAcollision updates the native reader and its “Selected reply” heading.
4. **Tablet and mobile — passed.** All tablet node stats stay above the lead indicator. Document widths match the 768px and 390px viewports.

Validation for this follow-up: 17 focused tests, 12 browser cases in three engines, a separate successful screenshot comparison run, TypeScript, targeted ESLint, formatting, and whitespace checks. The live browser error log is empty. The inherited VRT shutdown warning still appears after success and exit code 0.

Reduced motion is implemented in the Motion hook, CSS media query, and scroll behavior. OS preference toggling was not performed in the manual browser review. Authenticated posting and an exhaustive accessibility audit remain outside this visual refinement. No new package, polling loop, backend change, or remote mutation was introduced.

## Three overlapping ellipses — follow-up review

The user's latest direction replaces the concentric stadium rings with three overlapping ellipses in the existing Pubky brand color. The front ring has 32% opacity and no blur, the middle ring sits slightly lower at 24% with 2px blur, and the rear ring sits lower again at 16% with 5px blur. Painting back to front preserves the sharp front edge. Browser review caught WebKit rendering the SVG blur sharply. The final ellipses use rounded CSS borders and CSS blur, preserving the geometry while rendering the soft layers consistently across browsers. This supersedes the earlier one-time rim reveal and adds the continuous decorative motion now explicitly requested.

Independent 22/28/34-second CSS cycles vary rotation by less than 2 degrees, translation by at most 4px per axis, and scale by at most 1.5%. Offset phases keep the movement gentle and loosely orbital. Only the three decorative ellipses use these cycles; the existing reduced-motion rule disables them. No new dependency or JavaScript animation loop was added.

Evidence under `../planning/qa/ellipses/`: `before.png` and `after-desktop.png` use the same 1487 × 1058 viewport; `after-tablet.png` is 768 × 1024 and `after-mobile.png` is 390 × 844. These live captures use logged-out staging data, dark theme, ai, 7 days, and Most tagged. The inspected renders preserve native tags, icon statistics, readable standings, and zero horizontal overflow. Browser DOM inspection confirms exactly three ellipses, the requested opacities, progressive blur, the brand token, and changing transforms in successive samples. The live browser error log is empty.

Validation: TypeScript and targeted ESLint passed. Updated the 12 existing Hot screenshots across Chromium, Firefox, and WebKit, then verified them in a separate comparison run. The VRT harness disables animations for deterministic captures; live computed-style samples verified movement separately. Reduced-motion behavior is implemented in the CSS media rule; OS preference toggling was not manually exercised.

## Stronger orbital movement — follow-up review

The user requested more lines, movement, and rotation. The Arena now has six ellipses: the three existing depth layers plus three finer crossing lines. All use the native Pubky brand token and the 32/24/16% opacity palette. Cycles now span 10–20 seconds, with opposing rotations up to 14 degrees, drift up to 8px, and scale changes up to 6%. Reduced motion keeps the six-ring composition static. Content, controls, and standings retain their existing behavior.

Live evidence: `../planning/qa/dynamic-orbits/desktop.png` (1487 × 1058), `tablet.png` (768 × 1024), and `mobile.png` (390 × 844), all captured at matching CSS viewports, dark theme, logged-out staging, podcast, 7 days, Most tagged. Browser styles confirm six independently animated layers and the shorter durations. All three viewports have no horizontal overflow, and the browser error log is empty. The stronger crossing lines remain behind readable text and native tag controls.

TypeScript and targeted ESLint passed. All 12 existing Hot browser cases passed in Chromium, Firefox, and WebKit; their baselines were refreshed for the additional lines. The screenshot harness freezes motion, while the live review verifies the animated state. The existing reduced-motion CSS rule covers every orbit; OS preference switching was not manually exercised.

## Network reach, simpler timeframe controls, and doubled blur

Added “My network” between “All” and “Following”, reusing the native reach labels. Network topics use `UserStreamReach.WOT`; idea candidates use the existing `total_engagement:wot:all:<topic>` stream mapping. Authentication continues through the shared `requireAuth` handler. Removed the inline “Posts tagged…” explainer for every timeframe. On mobile, the heading and display toggle share the first row, with reach controls on the next row.

Doubled the existing orbit blur values: middle 2→4px, rear 5→10px, second crossing line 0.5→1px, third crossing line 1→2px. The front and first crossing line retain zero blur. Opacities and motion are unchanged.

Live evidence in `../planning/qa/network-blur/desktop.png` and `mobile.png` uses 1487 × 1058 and 390 × 844 CSS/pixel viewports, logged-out staging, dark theme, podcast, 7 days, Most replied. The toolbar order and removed copy match the request; the mobile layout has no horizontal overflow. Computed styles confirm all doubled radii, and the browser error log is empty.

TypeScript, targeted ESLint, formatting, and whitespace checks passed. All 15 browser cases passed across Chromium, Firefox, and WebKit, including a new regression proving network reach maps to WoT for both topics and idea candidates. Refreshed the existing Hot screenshots for the toolbar and blur changes. Authenticated live network results were not exercised in the logged-out session.

## Collection-style dropdown filters

Replaced the separate reach/view buttons and topic-timeframe row with four dropdowns beside Arena, ordered: tag timeframe, post timeframe, reach, view. The trigger and menu presentation reuse the same Button, DropdownMenu, Container, and Typography atoms and classes as CollectionLayoutPicker, including icons, chevron, and the green selected check on the right. Reach labels/icons use REACH_FILTER_META. Arena uses a Circle icon; List uses the collection picker’s Rows4 icon. Mobile wraps the four controls into two columns.

Both timeframe menus use the exact requested labels: Today, Last week, Last month, All time. The post default is Last month; the existing Hot store default is also Last month, and the live topic selection was updated to match. Topic window/reach still control native Hot requests. The independent post window filters the indexed timestamp used on native cards, before ranking topics or direct replies. Limited windows use the existing timeline stream; All time uses engagement order. The candidate cap and disclosure remain in place. This does not claim a global leaderboard of engagement earned within the window.

The live review confirmed independent post/topic/view selections, the recent-post candidate pool, native authentication when a guest selects My network, and retained controls after canceling that dialog. Desktop and mobile have no horizontal overflow. Final captures under `../planning/qa/dropdown-filters/`: desktop.png and post-menu.png at 1487 × 1058; mobile.png and mobile-menu.png at 390 × 844. All use dark theme, logged-out staging, Last month for both windows, and Arena view. Desktop/mobile source screenshots supplied by the user and the current CollectionLayoutPicker code guided the menu presentation.

Validation: 16 focused tests passed, including timestamp projection, exact rolling cutoffs, ranking after filtering, and new posts arriving after window selection. All 18 browser cases passed in Chromium, Firefox, and WebKit, with refreshed closed/open-menu screenshots, independent post/view behavior, network mapping, and responsive spacing checks. TypeScript, targeted ESLint, formatting, and whitespace checks passed. Authenticated live network data and posting remain outside this visual review.

## Native feed mini cards

Compared the Arena nodes with the actual regular PostMain card, PostHeaderUserInfo, PostText, PostActionsBar, and AvatarWithFallback. Arena now renders native Card shells with rounded-md corners and compact 16px padding (12px on phones). The header uses the native normal avatar-size and author-type mappings, the formatted public key, and the native avatar fallback/moderation behavior. Body and counter typography are shared constants consumed by both the feed and Arena, so the extracted defaults do not change the regular feed render. Previews remain two lines; tags and reply counts are the only metrics shown. No tag chip list or full action bar is mounted in the mini cards.

Live computed-style comparison against the selected native reader confirmed exact equality for the 40px avatar dimensions, Inter Tight font, 16px/20px/700 author type, 16px/24px/500 body type and color, 12px/16px/700 counter type and color, card background, and 8px resolved corner radius. Mini-card icons now match the native action icons at 16px. The native feed card has more padding and full content; the compact card keeps its existing selection behavior and preview text.

The leader keeps its trophy and rank badge, with rank indicators moved to the card edge. Selection uses an outline without replacing the native background. Increased the desktop arena height and row spacing to fit the cards; tablet and mobile retain readable native font sizes and 40px avatars. List rows also leave room for the rank badges. The same selected idea survives view changes, and selecting a card continues to open its native reader.

Evidence under `../planning/qa/mini-cards/`: before-desktop.png and desktop.png at 1487 × 1058, tablet.png at 768 × 1024, mobile.png at 390 × 844, and list.png at 1487 × 1058. Captures use dark theme, logged-out staging, stacker.news, Most tagged, and Last month in both filters. Live checks found no horizontal overflow at these sizes; all six tablet/mobile cards end above the lead indicator. The browser error log was empty during the completed visual inspection. The local development server subsequently stopped applying CSS updates and was restarted. The restored preview is loaded in a fresh browser tab at localhost:3003/hot. The List capture precedes the final increase in row spacing from 8px to 20px.

Validation: 199 focused tests passed for ArenaFloor, PostText, and PostActionsBar; TypeScript, targeted ESLint, formatting, and whitespace checks passed. Chromium and WebKit passed all six cases each. Firefox passed all six after allowing 0.5px for fractional grid rounding in the new card-fit assertions. Visual baselines were refreshed; the existing Vitest shutdown warning still appears after a successful exit. A concurrent rerun was canceled when it competed with the cold preview build. Subsequent UI tweaks will use lightweight checks, with a full browser quality pass reserved for the end of the UI optimization phase, as requested by the user.

## Shared timeframe and heading

Combined tag and post windows into the persisted Hot timeframe. The same value drives topic requests and post/reply eligibility, with a stable cutoff anchor scoped to each timeframe selection. The three dropdowns are Timeframe, Reach, and View. Timeframe icons match the native Hot filter (Star, CalendarRange, Calendar, Clock); existing Today / Last week / Last month / All time labels remain. The discovery heading now reads “Most popular ideas in [native colored tag] [timeframe]”, and Most replied is the default metric. Original-vs-replies mode retains its contextual heading.

Updated the existing browser scenario for shared timeframe behavior and default reply ranking. Full browser execution and screenshot baseline regeneration are deferred to the end of UI optimization at the user's request.

Lightweight review: the live desktop preview shows one timeframe control with the native month icon, the requested heading with its colored tag chip, and Most replied selected. Targeted ESLint, formatting, and whitespace checks passed.

## Ten clockwise topics and compact header stats

Arena requests ten topics and places them clockwise from twelve o'clock. Perimeter spacing and the inset post area keep the native tag chips clear of cards. Responsive grids retain all ten tags; List uses five columns on desktop. Doubled the existing blur radii to 8px, 20px, 2px, and 4px, with zero-blur layers unchanged. My network is the initial/reset Hot reach; saved selections are preserved and guests continue to use All. Mini-card tag/reply stats now replace the shortened public key beneath the author name, and the old stats footer is removed.

Lightweight verification: the live preview contains ten topics with clockwise placement, the new header stats, the exact doubled blur values, and no horizontal overflow. Seventeen existing ArenaFloor/HotStore unit tests passed; targeted ESLint and whitespace checks passed. Updated the VRT fixture and left-side spacing selector for the final quality pass; browser suites and baseline regeneration remain deferred.

## Inline ranking dropdown

Replaced the separate ranking toggles with a native dropdown inside the title: Most replied (default), Most tagged, Most reposted, and Newest, in that order with no divider. The trigger inherits the heading typography and uses only its label and a chevron. Competitive modes highlight the matching compact counter; Most reposted displays the persisted repost count. Newest sorts the native indexed timestamp and uses a timeline candidate stream even for All time. It removes post trophies and the lead announcement and labels the reader fallback as Latest reply. Topic rankings and their trophy retain their separate meaning.

Nineteen focused ranking, card-selection, and data-projection tests passed, along with targeted ESLint. The live preview confirmed menu order, no divider, repost counter emphasis, sequential Newest positions without a trophy or lead message, and no horizontal overflow. The default Most replied view was restored after verification. Updated the existing VRT scenario for the inline menu and chronological All time source; full browser suites and screenshot regeneration remain deferred until the end of UI optimization.

## Combined header sentence

Moved ranking, selected topic, timeframe, reach, and view beside the Arena heading in the requested sentence order. All four menus use the existing secondary pill button presentation with native icons and chevrons. The tag remains a search link. Removed the separate arena title and typography-only trigger styling; desktop card placement remains aligned with the perimeter tags. Phrase groups wrap without orphaning connector words from their dropdowns.

The header owns topic selection and stays mounted while its results scope changes, keeping filters available through loading, errors, and empty results. Added a request-version guard to the existing Hot tag hook so a late response from a previous timeframe cannot overwrite current topics or end their loading state. Three targeted tests cover stale success, stale error, and old-first completion. Live checks confirmed the single desktop row, topic selection updating the header search link, and all controls fitting a 390px viewport without horizontal overflow. Restored the desktop preview and original topic afterward. Full browser suites and screenshot regeneration remain deferred.

Follow-up copy uses “Show [most replied] ideas in [#1 topic] of [this month] by [my network] in [arena]”. All trigger labels are lowercase, and the monthly menu label is This month. Starting selections remain replies, the first ranked topic, the monthly timeframe, My network for signed-in users, and Arena; saved timeframe/reach preferences and the guest All fallback remain intact.
