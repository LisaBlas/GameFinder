# Recent Changes

Append what changed with date and a one-line summary. Prune entries older
than 7 days.

## 2026-09-24
- Fixed right-column search-result cards overshooting a full column to the
  left when expanded on desktop (`translateX` percent was measured against the
  doubled shell width). `client/src/App.css`.

## 2026-09-25
- Documentation maintenance: pruned expired change history, corrected the
  affiliate marketplace list, static Popular-card labeling, and stale
  pre-commit runtime guidance; reopened the ongoing change-log hygiene task.
- YouTube trailer thumbnail in `GameCard` now fetches `hqdefault.jpg` directly
  with `loading="lazy"` / `decoding="async"` (was `maxresdefault` with an
  `onError` fallback to `hqdefault`; the fallback chain cost a wasted request
  when no maxres image existed).
- `FilterContext` no longer imports the keyword taxonomy JSON at module load.
  The `slugToKeyword` map is built on first use via dynamic import, only when
  the URL has `kw` / `kw-ex` params. URL hydration with keyword params is now
  async. `KeywordSection` still imports the same JSON statically, so `Home`
  needs it on mount; the gain is only that the entry chunk no longer carries it.

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
