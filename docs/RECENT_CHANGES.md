# Recent Changes

Append what changed with date and a one-line summary. Prune entries older
than 7 days.

## 2026-10-13
- Documentation maintenance: corrected Hidden Gem's description to match its
  random prebuilt-pool draw and fallback; documented its API/build request
  flow in `ARCHITECTURE.md`; and marked stale map-planning descriptions as
  historical rather than current.

## 2026-10-12
- Added a compact Wayfinder information button. It opens a guide with all six
  roll icons, names, and descriptions; the guide uses the same bearing data as
  the playable rolls, so the explanation stays aligned with their behavior.
  `Wayfinder.tsx`, `KeywordSection.tsx`, `wayfinder.css`.
- Documentation maintenance: corrected `CLAUDE.md`'s Wayfinder-opening
  description (it said "circular reveal"; the code in `KeywordMap.tsx` /
  `App.css` is a bronze-framed stone slab that slides in from the right,
  matching the already-accurate 2026-10-11 entry below) and updated
  `PRODUCT_VISION.md`'s "discovery-card flow" reference to "Wayfinder
  discovery flow" (the `DiscoveryCard` deck was removed 2026-10-10 per
  `MEMORY.md`).

## 2026-10-11
- Wayfinder opening now uses a transform-only stone slab that slides from the
  right over the map. This replaces the stuttering aperture, clip, blur, and
  scale effects; its moving panel now reuses the relic UI's bronze nine-slice
  frame. Reduced-motion users retain the direct fade. `KeywordMap.tsx`,
  `App.css`, `wayfinder.css`.
- Documentation maintenance: pruned two expired entries (2026-09-24,
  2026-09-25 — their lessons already live in `SYSTEM_INVARIANTS.md`);
  corrected `npm test`'s documented scope in `CLAUDE.md` (it also covers
  `shared/**` and `server/**`, not just `client/src/**`); removed a stale
  `useMapCamera` reference in `MAP_FEATURE.md` (no camera/pan-zoom hook
  exists); and replaced `AGENTS.md`'s stale "Roll"/"Uniques" card-deck
  description (removed 2026-10-10) with the current Wayfinder-only mode list.

## 2026-10-09
- Desktop "Need a spark?" view rebuilt (Reliquary, then replaced by the
  Wayfinder: six bearings around a layered clockwork ring over the dimmed,
  still-mounted map). `Wayfinder.tsx`, `wayfinder.css`, `split-wayfinder.py`.

## 2026-10-10
- Mobile rebuilt on the desktop relic UI: one KeywordMap (thumb layout), the
  Wayfinder in a portrait layout, a Map view and a Results view with a relic
  header, sockets at every width. Old mobile shelf/deck/sheet/drawer removed
  with ~1.8k lines of dead CSS. Desktop taxonomy cards now render; path morphs
  tween (no NaN); narrow-pane header no longer overflows.
- Fixed: the floating Search button (and selection pills) were unreachable
  (desktop: dimmed + `inert`; mobile: effectively invisible) while the
  Wayfinder ("Need a spark?") was open, since a draw applies its filters
  immediately and the old code made the whole map layer — overlays included —
  recede and go inert as one unit. Split the recede/inert treatment onto two
  new wrappers, `.kmap-viewport-content` (map scene) and `.kmap-map-chrome`
  (toolbar/search lens/dock), and left the selection overlay out of both;
  raised its z-index to 13 to clear `.kmap-spark-stage` (12). `KeywordMap.tsx`,
  `App.css`.
