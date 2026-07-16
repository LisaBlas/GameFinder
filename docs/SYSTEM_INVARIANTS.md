# System Invariants

Hard rules that must not be violated without a deliberate, explicit decision.

## Windows build
`npm run build` completes the Vite client build and esbuild server bundle,
then fails at the final Unix `cp -r client/src/assets dist/` step on Windows.
Use Git Bash/WSL for the full build, or replace that copy step with a
cross-platform command before relying on it locally.

## Typecheck baseline
`npm run check` (root `tsc` against the whole app) is expected to pass.
Treat new failures as regressions, not background debt.

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

## Discovery card CSS class logic lives in one place
`DiscoveryCard.tsx` owns the construction of `.qs-card-*` state classes
(`qs-card-has-result`, `qs-card-rarity-*`, etc.). Do not duplicate that string
-building in `KeywordSection` or elsewhere.

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
