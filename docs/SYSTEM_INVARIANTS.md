# System Invariants

Hard rules that must not be violated without a deliberate, explicit decision.

## `npm run build` is mutating and shell-sensitive
`npm run build` is not a pure verification command. It currently runs
`npm install --include=dev` first, then the Vite client build and esbuild
server bundle, then a Unix `cp -r client/src/assets dist/` step. On Windows
shells that final copy step fails; on any platform the command can also
mutate the install state before the build even starts. Do not treat
`npm run build` as a clean read-only check.

## Typecheck baseline
`npm run check` (root `tsc` against the whole app) is expected to pass.
Treat new failures as regressions, not background debt.

## Search-result expansion must not reflow the grid
On desktop, expanding a game card must preserve the two-column grid slots.
`SearchResults` animates the selected card's stable wrapper and `GameCard`
expands visually over its adjacent slot; do not reintroduce a selected-card
grid-column span, which makes every result reflow without a transition.
A left-expanding (right-column) card shifts by `translateX(calc(-50% - 0.5rem))`:
translate percentages resolve against the shell's own doubled width, not the
slot, so `-100%` overshoots by a full column.

## Game cache requires `DATABASE_URL` in two places
SEO pages read their game cache (`seo_page_cache`) on Render at request time,
and the refresh script writes it on the VPS. `DATABASE_URL` must be set in
both places or the cache silently goes stale/empty. Without it the app still
works — pages just render with no game listings.

## Filter hydration depends on `game-filters.json`
Non-keyword filters (genre, theme, platform, mode, perspective) are stored in
the URL as integer IDs (e.g. `?genre=13`). `FilterContext` resolves these to
display names via `idToFilterName`, built from `game-filters.json` at module
load. If a filter pill shows a raw number instead of a name, the ID is missing
from `game-filters.json`.

## Keyword URL hydration is async; set sort and filters together
`FilterContext` builds the keyword slug map lazily (dynamic import of the
taxonomy JSON) only when the URL has `kw` / `kw-ex`. In that case hydration
must call `setSortBy` and `setSelectedFilters` together, after the map loads.
If sort is set earlier, the URL-sync effect fires with no keyword filters and
rewrites the URL, erasing `kw` / `kw-ex` before they hydrate.

## IGDB exclusion filters cannot use `!=`
`keywords != (id)` in Apicalypse does not mean "does not contain id" — it
means "the array is not equal to (id)," which is almost always true and does
nothing for exclusion. Array exclusions (`excludeKeywords`, `excludeFilters`)
must be enforced in application code after fetching, in
`igdbService.searchGames`.

## Sitemap is generated, not static
`client/public/sitemap.xml` is ignored in production. The real sitemap is
generated dynamically from `SEO_PAGES` in `server/seoRenderer.ts`. Do not edit
the static file expecting it to take effect.

## Pre-commit hook requires Node >=20.12
The `pre-commit` hook runs ESLint 10.7, which calls `util.styleText` and
therefore requires Node >=20.12. Node 18.x fails at the `eslint` hook stage
with `TypeError: util.styleText is not a function`, regardless of what
changed. This blocks *all* commits, not just ones touching lintable files.
Do not work around it with `git commit --no-verify` without asking first;
use a supported Node release (the workspace used v22.22.2 on 2026-09-25),
or downgrade `eslint` to a Node-18-compatible release.

## The desktop keyword pane is 40% of the viewport, not full width
`home.tsx` splits the desktop workspace into a keyword build panel
(`lg:w-2/5`) and a results panel (`lg:flex-1`). Everything `KeywordSection`
renders on desktop therefore lives in a pane of roughly **400–1000px**
(399px at a 1024 viewport, 565px at 1440, 1013px at 2560) — never the full
window. Do not give that subtree fixed multi-column grids or `min-w-*` boxes
sized for a full-width page: the pane's ancestor is `overflow-x: auto`, so an
oversized child does not throw a document-level scrollbar or fail any check
— it silently clips, and a `minmax(0,1fr)` column collapses to ~0px with its
content invisible. This is exactly how the
`grid-cols-[17rem_24rem_minmax(0,1fr)]` explorer shipped broken: it needed a
~2340px viewport to fit. Verify desktop keyword-pane layout by measuring
`.keyword-section`'s `scrollWidth - clientWidth` at 1024/1440/1920, not by
eyeballing one wide screenshot.

## `history.replaceState` must preserve `history.state`
Overlays (game card, saved panel) and the keyword map tag their history
entries; the map's Back/Forward retracing reads those tags on `popstate`.
Filter URL sync rewrites the URL on every filter change, so it calls
`replaceState(window.history.state, ...)`. Passing `null` would silently wipe
the tag and break Back after the first keyword is added.

## Filter URL sync must carry over the `map` param
`FilterContext.syncToUrl` rebuilds the query string from the filters. The home
page mounts the keyword map lazily, after that sync has run, so a shared
journey's `?map=` would be dropped before the map reads it. The sync copies
`map` across until `takeSharedJourney` consumes it.

## Product/brand constraints
- Dark theme only — do not add a light mode toggle.
- Deep forest neutral system with emerald (`#10b981`) as the primary accent —
  keep brand consistent.
- Keywords are curated with editorial intent — do not reorder or
  auto-generate them.
- Do not add unnecessary dependencies.
- Do not take screenshots to check visual work unless explicitly requested.
- Affiliate marketplace prices (Eneba, G2A, Kinguin, Instant Gaming) are not
  fetchable — those stores have no public pricing API. Only the official
  Steam price is live (`GET /api/steam-price`, 6h in-memory cache).

## Never spring an SVG path `d` in framer-motion
framer-motion cannot spring-interpolate a path string: it writes `NaN`
coordinates for the first frames (console: `<path> attribute d: Expected
number`). `KeywordMapScene` animates node positions with a spring but the
plate/card outlines (`d`) with a tween (`morph()`). Keep shape morphs on a
tween.

## Keyword map: what recedes behind the Wayfinder, and what doesn't
`kmap-map-layer` itself is a plain, unanimated container. Two children inside
it carry the "receded" scale/blur/opacity + `inert` treatment while the
Wayfinder is open: `.kmap-viewport-content` (the map scene/empty-states,
inside `.kmap-viewport`) and `.kmap-map-chrome` (toolbar — including the
selection pills — search lens, dock). The bottom-right Refresh/Search cluster
(`renderSelectionOverlays()`) is deliberately left out of both — a Wayfinder draw applies its filters
immediately (`clearAllFilters()` + `addFilter()`), so Search must stay
reachable without closing the panel first. Its z-index (13) is set above
`.kmap-spark-stage` (12) so it renders on top of the Wayfinder too; this only
works because none of `.kmap-window`/`.kmap-map-layer`/`.kmap-viewport` create
their own stacking context — if one of them gains `opacity`/`transform`/
`filter`/`isolation` later, re-check this ordering.
Clearance for the toolbar is therefore a `margin-top` on `.kmap-viewport`
(kmap-relic.css), not padding on `.kmap-window`; padding on the window sits
above the toolbar and lets nodes slide under it.
The selection-overlay div (`.kmap-user-selection-actions`) must stay a direct
child of the exact DOM node `viewportRef` points to (`.kmap-viewport`) —
`measureOverlays()` in `KeywordMap.tsx` queries it with a `:scope >` selector to compute layout
obstacles; moving it deeper breaks that silently.
