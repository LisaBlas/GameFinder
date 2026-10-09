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

## 2026-10-09
- Desktop "Need a spark?" view rebuilt as the Reliquary: altar with the drawn
  relic (identified from the live selection count), six carved vessel niches,
  shelf of session draws, "Explore on map" back to the map. Selection pills and
  Search now float over it as on the map. Mobile deck unchanged.
  `Reliquary.tsx`, `KeywordSection.tsx`, `reliquary.css`, `build-reliquary.py`.
