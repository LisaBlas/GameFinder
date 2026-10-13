# GameFinder - CLAUDE.md

## Project Overview
Game recommendation SPA with growing organic Google traffic.

- Live: https://gamefinder-app.com/ (hosted on Render, keep-alive cron on VPS every 10 min)
- Repo: https://github.com/LisaBlas/GameFinder

## Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), Framer Motion, wouter
- **Backend:** Express + Drizzle ORM + Neon/Postgres-related project setup
- **Styling:** Dark forest theme, emerald primary (`#10b981`), green-tinted `slate` scale, CSS vars, and Tailwind tokens in `tailwind.config.ts`

## Key Commands
```bash
npm run dev                 # dev server (tsx server/index.ts)
npm run build               # full build (client + server)
npm run start               # production
npm run db:push             # push schema to Neon
npm run db:seed             # seed database
npm run seo:refresh-cache   # repopulate seo_page_cache from IGDB (run on VPS, needs env vars)
npm run gems:build          # rebuild the Wayfinder's Hidden craft pool from IGDB (needs .env; ~2 min)
npm run check               # TypeScript check; expected to pass
npm test                    # node:test via tsx on client/src/**, shared/**, server/**/*.test.ts (no vitest)
```

See `docs/SYSTEM_INVARIANTS.md` for the Windows build gotcha and other hard
rules around these commands.

## Focused Docs
- `docs/ELI5.md` — what this app is, in plain language.
- `docs/ARCHITECTURE.md` — layout, SEO rendering, API data flow, styling
  system.
- `docs/SYSTEM_INVARIANTS.md` — hard rules and gotchas that must not be
  violated.
- `docs/MEMORY.md` — active product flows, roadmap notes, competitive
  positioning.
- `docs/RECENT_CHANGES.md` — what changed recently.

## Workflow
- From Slack, mention `@bot projects/GameFinder <task>` to start a session here.
- After changes, commit and push to `main` when explicitly requested. Render auto-deploys from main.

## Keyword Map Interaction
- Map-node clicks explore/recenter; adding and avoiding are explicit actions on the centered keyword, with node badges retained as shortcuts.
- `Only compatible` is the map's top discovery control; the current selection sits beside it as bare pills (click a pill to remove it; hidden until a first pick). Refresh (new options) and the count-aware results CTA share the bottom-right cluster.
- Keyword-panel structure and controls are skinned in `client/src/styles/kmap-relic.css` (both breakpoints; its last block rescales it for phones); optimized WebP assets live in `client/src/assets/ui/relic/raster/`; their high-res source PNGs live in `design/sources/` (outside `client/`, not bundled). Only keep assets in `client/src/assets/` that CSS/code actually references. Keep these changes container-only unless map behavior is explicitly in scope.
- The "Need a spark?" view is the Wayfinder (`components/Wayfinder.tsx`, styled in `client/src/styles/wayfinder.css`): six compass bearings surround a central destination and recent-route trail. It opens as a bronze-framed stone slab (`.kmap-spark-stage`) that slides in from the right over a dimmed, still-mounted map (reduced-motion users get a direct fade instead), so closing it restores the exact map location. The map's graph and its chrome (toolbar with the selection pills, search lens, dock) recede and go inert with it, but the bottom-right Refresh/Search cluster stays live and above the panel (z-index 13, clearing the stage's 12) — a draw applies its filters immediately, so Search must stay reachable without closing the Wayfinder first. See `docs/SYSTEM_INVARIANTS.md` ("Keyword map: what recedes behind the Wayfinder, and what doesn't") before changing this stacking. `KeywordSection` owns the draws and locks each destination's count from the selection preview (`useSelectionCount`), so it resolves without a search. Layered transparent chassis packs live in `client/src/assets/ui/wayfinder/` (`arcane` is active; `restrained` and `legendary` are alternatives); full-resolution generated sources live in `design/sources/`. Keep each pack aligned and regenerate its outer/mechanism/inner/socket layers with `scripts/split-wayfinder.py`. The active Arcane mechanism must come from the gemless source and be regenerated with `--only mechanism`; its outer/socket layers come from the gem source with `--detect-sockets`, and both runs pass the same `--inner-center` (the generated inner ring is drawn off-centre; measure with `scripts/measure-ring-center.py`). Exact commands are in the script docstring, since generated gems sit off a true orbit. Jewel/socket art belongs only to the stationary outer/socket layers. The six spokes (bars + arrowheads on the socket bearings) are drawn in the inner art but must stay still: the gem-source run passes `--spokes` (and `--neutral-gems`, which recolours the green source gems to smoky grey in the sockets layer), which lifts them into a static `spokes` layer above the ring and refills their holes from further round the ring. Only the inner ring moves (watch tick, plus a ticking spin per draw); its keyframes are generated by `scripts/wayfinder-ticks.py`, so re-run it instead of hand-editing them. Each bearing button lights only its nearest gem, after that spin ends (`animationend`); the gems are per-socket windows onto the shared sockets art, positioned by `--gx`/`--gy` in `wayfinder.css`, which must match the centres `--detect-sockets` prints. The centre gem on the core rim comes from `scripts/build-wayfinder-core-gem.py` (housing + greyscale stone that CSS tints to the rarity). The core itself is a layered lens from `scripts/build-wayfinder-core.py`: its bezel is cut from the inner layer's own lip (re-run the script if the inner layer is regenerated), plus a smoked-glass face and an engraved compass rose that spins while charting and locks north on the chosen bearing. On desktop the core is sized to 2 × the lip's outer radius (0.4668 of the chassis), so its bezel sits on the ring's lip. Keep the lens free of web chrome (no borders, pills or icon badges); its single action ("Open map") is a bronze hex plate, and rarity shows only as a glow along the bezel's inner edge. Mobile uses the same Wayfinder (portrait layout block in `wayfinder.css`); there is no mobile discovery deck, masthead, tab bar or bottom drawer — mobile is a Map view and a Results view (`mobileView` in `home.tsx`).
- The results pane (filter bar, sort, filter popovers, results summary, mobile results header) is skinned in `client/src/styles/results-relic.css`. Keep it frameless and asset-free: the game cards carry the ornament, and the chrome is type, bronze hairlines and hex plates only. Rarity color goes only on the results count and its rule. Generic filters (genre, platform, etc.) are emerald on both sides, while keywords are stone plates: the selection pills in `kmap-relic.css` and the whole desktop filter bar (chevrons, counts, quality toggles, sort plate) and picked popover chips in `results-relic.css`. Keep that split so the unique keywords read apart from the generic filters.
- Game cards use an **Archive Tablet** material system: the rarity frame is the forged chassis, `archive-tablet-slate.webp` is the single continuous record face, and `archive-tablet-iron.webp` is reserved for structural parts (media bezel, rating plate). Regions inside the card are separated by spacing only: no divider rules, grooves or rails. Keep additions within those three depth levels instead of introducing independent dashboard panels. Preserve the established styling of action/store buttons and taxonomy pills; do not skin them as forged tokens. The Stores rail stays neutral rather than inheriting rarity color. Rarity remains on the outer frame/seal, while gold communicates inscription/meaning and emerald communicates interaction.
- Expanded card body is grouped by decision, not data type: header (title, rating, actions, maker · year) → two columns (left: trailer; right: **Why it matches** → synopsis (clamped to 4 lines, max ~62ch, "Read more" directly below and only when clipped) → one primary store plate + one marketplace row + "Other stores (N)" disclosure) → **Details** (label/value rows: Platforms, Genres, Themes, Modes, Features = keywords; max 4 values + `+N` per row). Columns switch on the card's own width (`@container card-deck`, 680px), not the viewport. "Why it matches" names the searched filters the game satisfied (from `game._filterMatches`, display names from the game's own taxonomy because URL-hydrated filters are named by bare id) and is the one place the rationale lives; Details values only carry a small check. Details values are text, not pills: the "Add to search" affordance appears on hover/focus only. Primary store = first official destination (Steam first); the rotated affiliate marketplace is always the second row (revenue path), the rest go behind the disclosure. Platform labels/order come from `lib/platforms.ts` (obsolete platforms are hidden). Only the compact card is a `role="button"` click target; expanded inline cards close by clicking anywhere on the header (a `role="button"` with a hover wash and a chevron; share/save stop propagation) or the close X (fullscreen), never by clicking the body. The frame dims while expanded (`.game-card-shell-selected .game-card-frame-assembly`).
- Exception: the card sockets behind each result. Their walls are a pre-lit 9-slice from `scripts/build-card-socket.py`; the stone table and the sockets' honed floor come from `scripts/build-stone-table.py`, which grades CC0 Poly Haven scans kept in `design/sources/` (ambientCG Marble002 for the table, Poly Haven Seaside Rock for the socket floors; each socket offsets, shades and sheens the floor differently via `socketFloorStyle` in `SocketRack.tsx`). Re-run the scripts instead of hand-editing the WebPs. Sockets and stone are lit from above even though the forge glow is below: lit from below, a recess reads as a raised plate. Floors sit above the table's fixed CSS veil, so they are pre-darkened and carry their own viewport-fixed copy of the forge glow; if the veil in `AnimatedBackground.css` changes, retune both or the sockets look like they float. The table layer (`.ab-table`) is shifted with `.results-panel-scroll`'s scroll in `AnimatedBackground.tsx`; if the results scroller changes, keep that sync or the stone slides under the sockets.
- Before results arrive, `SocketRack` shows empty sockets laid out exactly like the results (an empty summary row, then the grid), so cards land in them without anything moving. This relies on the desktop results summary being one fixed-height line (chips fade out instead of wrapping) and on `--socket-h` matching real card height; anything added above the grid on desktop must be reserved in the rack too. On desktop, card frames are pushed out to the card edge (per-rarity `border-image-outset` in `results-relic.css`, measured from the frame PNGs) so they fit the socket walls; if frame art changes, re-measure. The card fade-in runs on the card, not the slot, because the slot draws the socket. While a search runs, the rack's sockets glow in a staggered pulse (`SocketRack loading`, `.card-socket-glow`); that glow is the entire loading state (no spinner or text). A previous batch fades out of its sockets first (`CARD_LEAVE_MS`).

## Git
- Branch: work on `main` or feature branches.
- Push to GitHub only when explicitly requested.
- Commits: keep focused, one concern per commit.
