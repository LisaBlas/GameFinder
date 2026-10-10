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
- The homepage `KeywordSection` has "Roll" and "Uniques" discovery sections above manual keyword browsing.
- Roll has four cards: **Popular** (curated popular keys, e.g. Action Roguelike → Souls-like), **Crafted** (hand-picked combos), **Random** (single random keyword, infinite), **Hidden Gem** (id `user-crafts`; fixed editorial combo — Cosmic Horror + Indie — labeled and iconed to read as a curated pick, not community data; renamed from "User Crafted" 2026-07-23 to close a trust gap where the old name/icon/copy implied live community-sourced data that doesn't exist).
- Uniques has two modes: **Unique Key** and **Unique Combo** — rare/low-result discovery sequences. They wrap back to the first item instead of locking; sequence progress is intentionally hidden in the Wayfinder.
- **Discovery architecture:** both breakpoints render the 6 modes as six clickable gem bearings in `Wayfinder` (`client/src/components/Wayfinder.tsx`), layered over a dimmed-but-mounted keyword map. The map's graph and chrome (including the selection pills, which live in the top map controls) recede/go inert, but the Search button floats above the Wayfinder itself (not dimmed, not inert) — see `docs/SYSTEM_INVARIANTS.md`. The top three gems are single-keyword rolls (Any Key, Popular, Unique Key); the bottom three are combination rolls (Unique Craft, Curated, Hidden Gem). Icons sit inside the gems, with the mode name beside them. Display names and clockwise socket order live in `renderWayfinder` (`KeywordSection`). Types `RevealCard`, `RarityTier`, and `getRarity()` are exported from that lib — do not redefine them inline in `KeywordSection`.
- **Adding a 7th mode:** add its ID to `RevealCard` (`client/src/lib/discoveryCards.ts`), write `applyXxx()` in `KeywordSection`, then add it to the Wayfinder bearings in `renderWayfinder` (six bearings are laid out on six sockets; a 7th needs chassis art and layout work).
- **Card states:** `idle` (never pressed) → `unidentified` (pressed, search running, "Unidentified" overlay shows) → `revealed` (search done, rarity badge + content shown).
- Future intent: save user searches/keyword combinations so strong community discoveries can feed Popular and Hidden Gem. Not live yet — see `docs/MEMORY.md` item 4.
- "Best crafts": keyword/filter combos with a low result count — treated as a signal for niche/unique game discovery.

## Keyword Map Navigation
- The keyword map is one continuous hierarchy: a map root with the three main categories → subcategories → keywords → related keywords. Do not restore a separate category-card/door screen.
- Once inside a category, the header keeps an explicit **All categories** action visible so users understand they can return to the root and combine keywords from unrelated directions.
- Map controls keep **Only compatible** and the selected-filter pills at the top-left. On mobile the smaller, pointed green pills form a horizontally scrollable row beneath **Only compatible**, and the compatibility explanation is hidden. The compact icon-only **New options** control sits beside Search at bottom-right, announces its first activation with an ember burst, and keeps a soft animated glow until its first click; that action cluster is measured as one layout obstacle.

## SEO Pages
Server-rendered landing pages exist at `/best/:slug`. Configs live in `server/seoPages.ts`; renderer in `server/seoRenderer.ts`. Game listings (top 10 per page) are cached in Neon (`seo_page_cache`) and injected at render time — refresh via `npm run seo:refresh-cache` on the VPS. The sitemap is generated dynamically — do not edit `client/public/sitemap.xml`. See [docs/ARCHITECTURE.md](/home/blas/projects/GameFinder/docs/ARCHITECTURE.md) for full details.

## Verification Defaults
- Documentation-only changes: re-read edited files and run lightweight presence/readability checks.
- UI/behavior changes: run the smallest relevant build/test/check first, then broaden only when the touched surface warrants it.
- `npm run check` passes cleanly; run it as a baseline signal and treat failures as regressions.
