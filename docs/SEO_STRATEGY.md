# GameFinder SEO Strategy — Planning Document

## The Core Opportunity

GameFinder can rank on the first page of Google for a large number of long-tail searches by creating dedicated server-rendered pages for specific keyword/filter combinations (e.g. `/best/parry-games`, `/best/ragdoll-physics-games`).

This is called **programmatic SEO**: one URL per search intent, each with real content Google can crawl and index.

**Key distinction:** pages must render content inline — not redirect to search results. A redirect is a doorway page (against Google guidelines). The current architecture already does this correctly.

---

## Ranking Potential (Tiered)

| Tier | Examples | Effort | Expected result |
|------|----------|--------|-----------------|
| Easy wins | "parry games", "ragdoll physics games", "bullet time games" | Low | Page 1 within months — mechanic searches have near-zero dedicated-page competition |
| Medium effort | "soulslike games with parry", "wholesome farming games" | Medium | Beatable with structured SSR pages vs. Reddit threads and listicles |
| Hard (skip for now) | "best PC games", "horror games", "roguelike games" | Very high | IGN, Steam, GameSpot, and dedicated genre sites own these |

**The mechanic angle is the core insight.** Major gaming sites organize by genre and platform, not by mechanic. Steam's mechanic tags are JavaScript-rendered and invisible to Google. No competitor has dedicated, crawlable pages for mechanic-specific searches.

---

## Competition Analysis

- **Large gaming sites** (IGN, Metacritic, GameSpot): focus on reviews and news, not mechanic or combinatorial discovery pages
- **Mid-tier SEO sites** (DualShockers, GameRant, TheGamer): do write mechanic-based lists, but as static listicles — no filtering, no live data, decays over time
- **Steam**: filtered results are JavaScript-rendered — invisible to Google
- **Reddit**: ranks well but static, no interactivity, decays over time
- **RAWG.io**: has the data, weak SEO execution

**GameFinder's structural advantage over all of them:** their pages are static lists. GameFinder's pages show real, filterable, up-to-date IGDB results with covers, ratings, and interactive filtering. That is better content by Google's definition — and it compounds as new games are added to IGDB.

---

## Will Google Reward This Model?

**Yes, conditionally.** Google's Helpful Content Update (2023–2024) penalizes thin programmatic pages. What it rewards:

- Pages that fully answer a specific search intent
- Unique editorial content (even 2–4 sentences describing the category)
- Good engagement signals (time on page, clicks into game detail pages)
- Structured data (JSON-LD: CollectionPage, WebApplication schemas)
- Internal linking between related pages

**The make-or-break factor:** every generated page needs something beyond a filtered list. A short, accurate category description is the minimum bar.

---

## Current State Assessment

### What's already well-built (30 pages in `server/seoPages.ts`)

- Server-rendered HTML at `/best/:slug` — correct architecture, no React required for crawling
- Genuine editorial intro paragraphs per page (not thin/generated)
- JSON-LD structured data (CollectionPage + WebApplication)
- Canonical URLs, Open Graph, Twitter cards
- Internal linking via `relatedSlugs`
- Sitemap inclusion (dynamic, generated from `SEO_PAGES`)
- Breadcrumb navigation
- GA4 event tracking on CTA clicks (`seo_open_app`)

### The one real weakness

**SEO pages show no actual games.** Google sees: intro paragraph → filter chips → CTA button → related links. There is no game list for Googlebot to index.

A competitor page that lists even 10 game titles with short descriptions has significantly more indexable, rankable content per URL. This is the single biggest lever remaining.

---

## Keyword Strategy

Research and curation is complete. See **`docs/SEO_KEYWORDS.md`** for the full source of truth.

### Two page types

**Single-keyword pages** — the keyword itself is the search query. The slug maps directly to one IGDB keyword filter.

- Examples: `/best/parry-games`, `/best/ragdoll-physics-games`, `/best/farming-games`
- Use when: the keyword alone defines a clear, searchable intent
- Scale: ~200 confirmed targets in SEO_KEYWORDS.md

**Combo pages** — two or more keywords/filters combine to define a specific niche that neither covers alone.

- Examples: `/best/dancing-party-games`, `/best/wholesome-farming-games`, `/best/parry-soulslike-games`
- Use when: adding the second keyword changes *who* the page is for, not just narrows the result count
- Scale: ~50–100 high-confidence combos as a second batch

**Target scale: ~300 pages in the first launch batch.**

### Keyword tiers

**Priority — Mechanic-Based (build first):** Parry, Ragdoll Physics, Bullet Time, Grapple, Parkour, Wall Jump, Souls-like, Martial Arts, Melee, Duels, Destructible Environment, Physics-Focus, Music & Rhythm, Permadeath, Gore, Time Travel, Physics

These have the lowest competition and highest search intent alignment with GameFinder's filtering system.

**Second tier:** setting/mood/aesthetic keywords (Steampunk, Post-Apocalyptic, Psychological Horror, Wholesome, etc.) and simulation genres (Farming, City Builder, Dating, etc.)

**Combo tier:** mechanic × mood pairs identified during curation (see SEO_KEYWORDS.md Priority Combos section).

---

## Implementation Priorities

### ~~1. Add game listings to SEO pages~~ ✅ Done (May 2026)

Top 10 games per page are cached in Neon (`seo_page_cache` table) and rendered server-side on every `/best/:slug` page. Cover image, rating badge, and summary are included. JSON-LD `ItemList` added to structured data. Cache refresh runs via `npm run seo:refresh-cache` — added to VPS nightly cron.

Key files: `server/seoRenderer.ts`, `server/scripts/refreshSeoCache.ts`, `server/db.ts`, `shared/schema.ts`.

### ~~2. Build the mechanic-based priority pages~~ ✅ Done (May 2026)

16 mechanic pages deployed: parry, ragdoll physics, bullet time, parkour, wall jump, grapple, music/rhythm, permadeath, gore, physics, physics puzzle, destructible environment, time travel, melee, martial arts, duels. Hand-written intros, single-keyword filters.

### ~~3. Scale to ~300 pages (single-keyword)~~ ✅ Done (May 2026)

Generator script built from `SEO_KEYWORDS.md`. 169 pages auto-generated across 23 sub-categories (sports, combat systems, art styles, time periods, atmosphere, etc.) with 2–3 templated intro variants per category. Total live: **215 pages**.

Key files: `server/scripts/seoKeywords.ts`, `server/scripts/generateSeoPages.ts`, `server/generatedSeoPages.ts`. Run `npm run seo:generate-pages` to regenerate after editing keywords.

Cache refreshed on VPS after deploy — all 215 pages have game listings.

### 4. Get pages indexed and monitor GSC

Submit sitemap, request indexing in priority order, watch for impressions.

### 5. Combo pages (~50–100)

Mechanic × mood/setting pairs. One confirmed priority target already in `SEO_KEYWORDS.md`: `dancing` + `party`. Build single-keyword pages first (done), then combos as a second batch.

---

## Architecture Notes

- New pages are added to `server/seoPages.ts` as `SeoPage` objects
- `server/seoRenderer.ts` handles HTML rendering — renders game list inline from cache
- `server/db.ts` — Neon/Drizzle connection (null-safe; pages degrade gracefully without it)
- `server/scripts/refreshSeoCache.ts` — cache refresh script, run via `npm run seo:refresh-cache`
- `shared/schema.ts` — `seo_page_cache` table + `CachedGame` type
- `server/routes.ts` registers `/best/:slug` before the SPA fallback
- Sitemap auto-updates from `SEO_PAGES` — no manual edits needed
- CTA URLs are built by `buildAppUrl()` from filter configs
- Combo pages use multiple keyword IDs in the filter config — same architecture, no changes needed

---

---

## Open Checklist

### Indexing (this week)
- [x] Request indexing: `cozy-games`
- [x] Request indexing: `souls-like-games`, `roguelike-games`, `roguelite-games`, `metroidvania-games`, `cozy-horror-games`, `cozy-farming-games`, `dungeon-crawler-rpg-games`, `pixel-art-games`
- [ ] Request indexing: 16 mechanic pages (parry, ragdoll-physics, bullet-time, parkour, wall-jump, grapple, music-rhythm, permadeath, gore, physics, physics-puzzle, destructible-environment, time-travel, melee, martial-arts, duels)
- [ ] Resubmit sitemap in GSC (now 215 URLs — delete old entry, re-add)
- [ ] Batch-request indexing for generated pages, priority order: combat/mechanic categories first, then art styles and atmosphere, then time periods and cultural

### Infrastructure
- [x] `npm run seo:refresh-cache` added to VPS nightly cron
- [ ] Confirm cron is actually firing (check VPS cron logs or run manually and verify `updated_at` timestamps in Neon)

### Content (next batch)
- [ ] Build combo pages: start with `dancing-party-games` (confirmed priority in SEO_KEYWORDS.md)
- [ ] Identify 10–20 highest-confidence combos from SEO_KEYWORDS.md Priority Combos section and build them
- [ ] Review generated page intros for any keywords where the template reads awkwardly (especially cultural_ip and internet_culture categories)

### Monitoring
- [ ] Check GSC in ~2 weeks for first impressions on mechanic pages
- [ ] Identify pages with impressions but low CTR (title/description optimization opportunity)
- [ ] Track which pages start ranking and use them to inform combo page priorities

---

## Resolved Decisions

1. **Game data: cache in Neon, refresh nightly.** Store top 10 game results per slug in a `seo_page_cache` table (slug, games JSON, updated_at). Render from cache, fall back to live on cache miss. The VPS keep-alive cron already runs nightly — add a cache refresh job there. Avoids IGDB rate limits, latency, and downtime risk at 300+ pages.

2. **Intro copy at scale:** TBD — see below.

3. **Search Console: already set up for gamefinder-app.com.** GSC analysis complete (May 2026). Key findings:
   - All traffic is brand search ("game finder", "gamefinder") — no discovery traffic yet
   - robots.txt is correct (`Allow: /`); 3 redirect pages are www/non-www variants (not urgent)
   - **Indexing requests submitted (May 2026):** `cozy-games` + 8 priority pages from the original 30. 16 mechanic pages pending (submit tomorrow). Sitemap resubmission pending (now 215 URLs).
   - **Next GSC action:** resubmit sitemap (GSC → Sitemaps → delete → re-add), then batch-request indexing for mechanic and generated pages. Check back in ~2 weeks for first impression data.

## Resolved: Intro Copy at Scale

**Approach: hand-written category templates, filled at generation time.**

The keyword list in `SEO_KEYWORDS.md` maps to ~28 sub-categories, not 300 unique intro types. Write 2–3 intro template variants per sub-category (~60–80 sentences total). The generator script picks a variant and fills in a `{keyword}` slot and optionally `{example_games}` from the cache. Templates are written once, reviewed once, carry editorial voice, and require no API dependency.

**Critical constraint: never ship templated pages without game listings.** A templated intro is 3 sentences on a page that also has 10 unique game titles, covers, ratings, and descriptions — Google sees unique content. A templated intro on a page with no game data is thin/duplicate content and an HCU liability. The sequence is non-negotiable:

1. Add game listings to existing pages first (Priority 1)
2. Only then launch new pages with templated intros

Title tags, H1s, and meta descriptions are unique per page by definition since the keyword changes — this is sufficient for Google to treat each page as distinct even when intro templates are shared across a sub-category.
