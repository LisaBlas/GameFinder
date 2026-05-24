# GameFinder - AGENTS.md

## Codex Project Instructions
This repo is the local GameFinder workspace. Treat `CLAUDE.md` as durable project memory for stable architecture, workflow, and gotchas. Keep it updated when facts change in ways that future sessions should inherit.

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
- Ask before destructive git operations, commits, or pushes.
- Keep commits focused when the user asks for commits.

## Product Constraints
- Preserve curated keyword ordering, category names, and meaning.
- Do not add price-fetching infrastructure unless explicitly requested.
- Keep the dark forest/emerald visual system consistent.
- Do not add a light mode toggle unless explicitly requested.
- Prefer revenue-relevant improvements: affiliate flows, conversion clarity, SEO, and recommendation quality.

## Homepage Discovery Features
- The homepage `KeywordSection` has "Roll" and "Uniques" discovery sections above manual keyword browsing.
- Roll has four cards: **Popular** (curated popular keys, e.g. Action Roguelike → Souls-like), **Crafted** (hand-picked combos), **Random** (single random keyword, infinite), **User Crafted** (community combos).
- Uniques has two cards: **Unique Key** and **Unique Combo** — rare/low-result discovery sequences. Cards show step progress like `1/5` and wrap back to the first item instead of locking.
- **Card system architecture:** all 6 cards are rendered via the reusable `DiscoveryCard` component (`client/src/components/DiscoveryCard.tsx`). Canonical card names and section membership live in `DISCOVERY_CARD_META` (`client/src/lib/discoveryCards.ts`). Types `RevealCard`, `RarityTier`, and `getRarity()` are exported from that lib — do not redefine them inline in `KeywordSection`.
- **Adding a 7th card:** add its ID to `RevealCard` + an entry in `DISCOVERY_CARD_META`, write `applyXxx()` in `KeywordSection`, drop one `<DiscoveryCard>` into the grid.
- **Card states:** `idle` (never pressed) → `unidentified` (pressed, search running, "Unidentified" overlay shows) → `revealed` (search done, rarity badge + content shown).
- Future intent: save user searches/keyword combinations so strong community discoveries can feed Popular and User Crafted.
- "Best crafts": keyword/filter combos with a low result count — treated as a signal for niche/unique game discovery.

## SEO Pages
Server-rendered landing pages exist at `/best/:slug`. Configs live in `server/seoPages.ts`; renderer in `server/seoRenderer.ts`. Game listings (top 10 per page) are cached in Neon (`seo_page_cache`) and injected at render time — refresh via `npm run seo:refresh-cache` on the VPS. The sitemap is generated dynamically — do not edit `client/public/sitemap.xml`. See the SEO Architecture section in `CLAUDE.md` for full details.

## Verification Defaults
- Documentation-only changes: re-read edited files and run lightweight presence/readability checks.
- UI/behavior changes: run the smallest relevant build/test/check first, then broaden only when the touched surface warrants it.
- `npm run check` passes cleanly; run it as a baseline signal and treat failures as regressions.
