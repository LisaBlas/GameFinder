# GameFinder - AGENTS.md

## Codex Project Instructions
This repo is the local GameFinder workspace. Treat `AGENTS.md` plus the core
docs in `docs/` as durable project memory for stable architecture, workflow,
and gotchas. Keep them updated when facts change in ways that future sessions
should inherit.

## Environment
- OS: Windows 11.
- Shell: PowerShell.
- Workspace: local-first.
- Default stack: npm, React, TypeScript, Vite, Express.

## Workflow
- Read the current code before changing behavior; this project moves quickly and docs can lag.
- `npm run check` (full tsc) is expected to pass — treat new failures as regressions.
- Do not take screenshots for visual checks unless the user explicitly asks.
- Ask before installing dependencies.
- Ask before touching secrets, credentials, auth files, or production data.

## Product Vision
Core use case: a user with a specific idea (e.g. "bullet hell", "vikings +
strategy") picks precise keywords to find games that fit it exactly, including
niche games generic search wouldn't surface. "Find similar" (starting from a
game you like) is a common secondary path, not the differentiator. See
[docs/PRODUCT_VISION.md](/home/blas/projects/GameFinder/docs/PRODUCT_VISION.md)
for full detail.

## Product Constraints
- Preserve curated keyword ordering, category names, and meaning.
- Do not add price-fetching infrastructure unless explicitly requested.
- Keep the dark forest/emerald visual system consistent.
- Do not add a light mode toggle unless explicitly requested.
- Prefer revenue-relevant improvements: affiliate flows, conversion clarity, SEO, and recommendation quality.

## Homepage Discovery Features
- There is no separate "Roll"/"Uniques" card deck above manual keyword
  browsing (that `DiscoveryCard` deck was removed 2026-10-10). All six draw
  modes now live only in the Wayfinder (see below): **Popular** (curated
  popular keys, e.g. Action Roguelike → Souls-like), **Curated craft** (hand-picked
  combos, id `rare-combo`), **Random** (single random keyword, infinite, id
  `common-keyword`), **Hidden craft** (id `user-crafts`; a random pairing from
  `client/src/assets/hidden_gems.json`, served by `GET /api/hidden-gems` and
  prebuilt by `npm run gems:build`. A pairing qualifies when its games — fetched
  from IGDB — are few (≤15), come from ≥3 independent families (franchise,
  collection, developer or title word) with none dominating, include a
  well-rated payoff game, and at least one keyword is about setting/aesthetic/
  culture. Rules in `shared/hiddenGems.ts`; candidates from `findRarePairings`
  in `shared/keywordDiscoveries.ts`. Re-run after a co-occurrence crawl or an
  editorial change; `KEYWORD_EDITORIAL.block` prunes a pair (and cleans the
  map). Falls back to Cosmic Horror + Indie if the pool is unavailable), and the uniques **Unique** / **Unique craft** —
  rare/low-result discovery sequences. They wrap back to the first item
  instead of locking; sequence progress is intentionally hidden in the
  Wayfinder.
- **Discovery architecture:** both breakpoints render the 6 modes as six clickable gem bearings in `Wayfinder` (`client/src/components/Wayfinder.tsx`), layered over a dimmed-but-mounted keyword map. The map's graph and chrome (including the selection pills, which live in the top map controls) recede/go inert, but the Search button floats above the Wayfinder itself (not dimmed, not inert) — see `docs/SYSTEM_INVARIANTS.md`. The top three gems are single-keyword rolls (Random, Popular, Unique); the bottom three are combination rolls (Unique Craft, Curated Craft, Hidden Craft). Icons sit inside the gems, with the mode name beside them. Display names and clockwise socket order live in `renderWayfinder` (`KeywordSection`). Types `RevealCard`, `RarityTier`, and `getRarity()` are exported from that lib — do not redefine them inline in `KeywordSection`.
- **Adding a 7th mode:** add its ID to `RevealCard` (`client/src/lib/discoveryCards.ts`), write `applyXxx()` in `KeywordSection`, then add it to the Wayfinder bearings in `renderWayfinder` (six bearings are laid out on six sockets; a 7th needs chassis art and layout work).
- **Card states:** `idle` (never pressed) → `unidentified` (pressed, search running, "Unidentified" overlay shows) → `revealed` (search done, rarity badge + content shown).
- Future intent: save user searches/keyword combinations so strong community discoveries can feed Popular and Hidden craft. Not live yet — see `docs/MEMORY.md` item 4.
- "Best crafts": keyword/filter combos with a low result count — treated as a signal for niche/unique game discovery.

## Keyword Map Navigation
- The keyword map is one continuous hierarchy: a map root with the three main categories → subcategories → keywords → related keywords. Do not restore a separate category-card/door screen.
- Once inside a category, the header keeps an explicit **All categories** action visible so users understand they can return to the root and combine keywords from unrelated directions.
- Map controls keep **Only compatible** and the always-visible keyword search field together at the top-left, with the selected-filter pills in a second row beneath them on both breakpoints. On mobile the smaller, pointed pills form a horizontally scrollable row and the compatibility explanation is hidden. The compact icon-only **New options** control sits beneath the centred map node and matches its **Exclude** / **Add** actions; it keeps a soft animated glow until its first click. The primary Search CTA remains at bottom-right and is measured as a layout obstacle.

## SEO Pages
Server-rendered landing pages exist at `/best/:slug` and `/games-like/:slug`. Configs live in `server/seoPages.ts`; renderer in `server/seoRenderer.ts`. Game listings (top 10 per page) are cached in Neon (`seo_page_cache`) and injected at render time — refresh via `npm run seo:refresh-cache` on the VPS. The sitemap is generated dynamically — do not edit `client/public/sitemap.xml`. See [docs/ARCHITECTURE.md](/home/blas/projects/GameFinder/docs/ARCHITECTURE.md) for full details.

## Verification Defaults
- Documentation-only changes: re-read edited files and run lightweight presence/readability checks.
- UI/behavior changes: run the smallest relevant build/test/check first, then broaden only when the touched surface warrants it.
- `npm run check` passes cleanly; run it as a baseline signal and treat failures as regressions.
