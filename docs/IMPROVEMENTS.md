# GameFinder — Improvement Backlog

Competitive analysis conducted May 2026. Main competitors assessed: WhatOPlay, Boredgame.lol, GamesFinder.gg.

Items marked ✅ are already shipped.

---

## Completed

- ✅ **Empty state → preset vibe search cards** — 6 clickable cards with live keyword pills replace the blank results panel on first load. Teaches the filter language by example.
- ✅ **Remove Kinguin cookie modal** — replaced DOM-injected iframe modal with a direct affiliate search link. The `r=` param in the URL is sufficient for Kinguin tracking.

---

## Backlog

Priority order: impact vs. effort. Do the top rows first.

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 1 | Copy search link button | Medium | Very Low |
| 2 | Expand SEO pages to 100+ | High | Low |
| 3 | Email capture on `/best/*` pages | High | Low |
| 4 | Trending searches on homepage | Medium | Medium |
| 5 | Shareable wishlist URL | Medium | Medium |
| 6 | "Vibe Search" via Claude API | Very High | Medium |
| 7 | "What's next after X" landing page | High | Medium |
| 8 | TypeScript baseline debt cleanup | Velocity | Medium |

---

### 1. Copy search link button

**What:** A one-click "Copy link" button in the results header that copies the current search URL to the clipboard. URL params already encode the full filter state (`?kw=cozy,farming&genre=13`).

**Why:** Users on Reddit, Discord, and gaming communities constantly ask "what should I play next?" — a shareable search link lets them say "here's my search, judge it." Zero backend work required.

**How:** Add a small icon button next to the sort dropdown in `SearchResults.tsx`. On click: `navigator.clipboard.writeText(window.location.href)` with a brief "Copied!" confirmation state. The URL sync in `FilterContext` already keeps the URL current.

---

### 2. Expand SEO pages to 100+

**What:** The 30 curated `/best/:slug` pages in `server/seoPages.ts` are the main organic traffic driver. Adding 70+ more covers the long-tail searches that bring high-intent visitors.

**Why:** Competitors with UGC have unlimited long-tail coverage. A static list of 100 well-written pages punches well above its weight for a solo project.

**Suggested new slugs to add:**
- `games-like-stardew-valley`, `games-like-hollow-knight`, `games-like-disco-elysium`
- `best-games-for-couples`, `best-games-for-anxiety`, `best-short-games`
- `best-indie-rpg-games`, `best-narrative-games-2024`, `best-atmospheric-games`
- `tower-defense-games`, `deck-builder-games`, `walking-simulator-games`
- `best-horror-games-not-scary`, `best-games-with-good-story`, `best-sandbox-games`
- `bullet-hell-games`, `isometric-rpg-games`, `farming-sim-games`

**How:** Each entry in `SEO_PAGES` takes ~10 minutes. The renderer and sitemap update automatically. Focus on high search-volume phrases that map cleanly to existing keyword IDs.

---

### 3. Email capture on `/best/*` pages

**What:** A simple "Get one game recommendation a week" signup at the bottom of every SEO landing page. Converts organic search traffic into an owned audience.

**Why:** SEO traffic is rented. An email list is owned. Even 500 subscribers is a meaningful channel for future product announcements, affiliate promotions, and content.

**How:** Add a signup form to `seoRenderer.ts` rendered HTML. Use Beehiiv or Mailchimp free tier (both have embeddable forms with no backend required beyond the form POST). One `<form>` block added to the SSR template, placed below the Related Searches section.

---

### 4. Trending searches on homepage

**What:** A "Popular right now" section on the homepage showing the top 5–10 keyword combinations searched in the past 7 days.

**Why:** Social proof + FOMO. Users see that other people are actively using the tool and get inspired by combinations they hadn't thought of. Also surfaces seasonal trends (e.g. horror games in October).

**How:**
- The search history is already being saved via `storage.saveSearch()` in `server/routes.ts`
- Add a `/api/trending` endpoint that queries the last 7 days of searches, groups by keyword combination, and returns the top N
- Add a `TrendingSearches` component that fetches this on load and renders clickable pills (using `applyFiltersAndSearch`)
- Render it in the `SearchPlaceholder` component below the preset cards, or as a separate section

**Note:** If search volume is low, use a manually curated static list until organic data is sufficient.

---

### 5. Shareable wishlist URL

**What:** A "Share list" button in the saved games panel that encodes the saved game IDs into a URL: `/?saved=1234,5678`. A landing page reads those IDs, fetches the games, and renders a read-only "here's someone's wishlist" view.

**Why:** Gaming communities love sharing lists. "Here are the 12 games I want to play this year" shared on Reddit or Discord drives organic traffic and brand awareness. Each shared URL is a backlink.

**How:**
- Add a `Share` button to `SavedGamesPanel.tsx`
- Encode IDs: `/?saved=${savedGames.map(g => g.id).join(',')}`
- In `FilterContext` URL hydration (or a new route), detect the `saved` param, fetch each game via `/api/games/:id`, and render them as a read-only game list
- No auth, no database — purely URL-encoded

---

### 6. "Vibe Search" via Claude API

**What:** A natural language text input — *"I want something cozy and slightly spooky for a rainy Sunday"* — that translates to keyword IDs and runs a search.

**Why:** The curated keyword taxonomy is the perfect structured output schema for an LLM. No competitor does this. It would be genuinely viral on gaming subreddits and Hacker News. Claude API cost is trivial per query (~$0.001).

**How:**
- Add an input field to the left panel (below the keyword section header, above the category explorer)
- On submit: POST to a new `/api/search/vibe` endpoint
- Server-side: call Claude API with a prompt that maps the natural language input to keyword IDs from the curated list (pass the keyword taxonomy as context)
- Return the matched Filter objects and run `applyFiltersAndSearch`
- Use `claude-haiku-4-5` for cost efficiency — this is a structured extraction task, not a reasoning task

**Prompt skeleton:**
```
You are a game recommendation assistant. Given a mood description, 
return a JSON array of keyword IDs from this list: [<keyword taxonomy>].
Return 2–4 keywords max. Only use IDs from the provided list.
Input: "<user text>"
```

---

### 7. "What's next after X" landing page

**What:** A dedicated entry point at `/similar/<game-slug>` — e.g. `/similar/hollow-knight` — that pre-seeds the "find similar" flow and renders as a crawlable SSR page.

**Why:** "What should I play after X?" is one of the most searched gaming queries. Each URL is a free organic landing page. The "find similar" feature already exists but is buried inside an expanded game card.

**How:**
- Add a new route in `server/routes.ts`: `GET /similar/:slug`
- Server renders a minimal HTML page with the game name, a short description, and a CTA button that opens `/?seed=<gameId>`
- In `FilterContext` URL hydration, detect the `seed` param and auto-trigger the similar-game flow (`setSeedGame` + fetch `/api/games/:id/similar-seed` + `applyFiltersAndSearch`)
- Generate a static list of the top 50 game slugs for the sitemap

---

### 8. TypeScript baseline debt cleanup

**What:** Fix the known TS errors documented in `CLAUDE.md` that make `npm run check` permanently red.

**Why:** The current baseline failures mean TS errors in new code go undetected. This is a velocity tax that compounds over time.

**Files to fix:**
- `client/src/components/GameCard_DiscountedStores_Backup.tsx` — delete or archive outside `src/`
- `client/src/pages/api/keywords/search.ts` — stale Next.js API route in a Vite project; delete it
- `server/storage.ts` — imports removed schema exports; update or stub them
- `client/src/components/ui/sidebar.tsx` — rename `useMobile` import to match the actual export
- `client/src/context/FilterContext.tsx` — fix `pendingRequests[nextPage]` type condition
- `server/vite.ts` — fix `allowedHosts` type mismatch

---

## Competitive Context (reference)

| Competitor | Strength | Weakness vs. GameFinder |
|---|---|---|
| WhatOPlay | User accounts, reviews, deal prices | Cluttered UI, no exclude logic, no mood/vibe angle |
| Boredgame.lol | Simple UX, low friction entry | No filter depth, no affiliate monetization |
| GamesFinder.gg | Raw IGDB power, comprehensive data | No curation, no aesthetic, no keyword taxonomy |
| Backloggd | Social layer, lists, reviews | Not a discovery tool |
| IsThereAnyDeal | Price tracking, deal alerts | Not mood/keyword discovery |

**GameFinder's durable advantages:** curated keyword taxonomy, include+exclude logic, dark forest aesthetic, split desktop UX, SSR SEO pages, affiliate stack already wired.
