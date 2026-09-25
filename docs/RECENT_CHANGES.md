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
