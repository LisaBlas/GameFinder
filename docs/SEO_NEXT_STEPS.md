# GameFinder SEO Next Steps

## Immediate Validation

- Verify deployed SEO pages return crawlable HTML:
  - `/best/cozy-games`
  - `/best/survival-crafting-games`
  - `/best/dark-fantasy-rpg-games`
  - `/best/souls-like-games`
- Verify unknown SEO pages return `404` and `noindex`.
- Verify `/sitemap.xml` includes `/` plus all curated `/best/*` pages.
- Verify each SEO page has a unique title, meta description, canonical URL, H1, filter chips, CTA, related links, and JSON-LD.
- Verify CTA links hydrate the app filters and trigger the existing auto-search flow.

## Search Console Launch

- Submit `https://gamefinder-app.com/sitemap.xml` in Google Search Console.
- Inspect and request indexing for the strongest first pages:
  - `/best/cozy-games`
  - `/best/cozy-farming-games`
  - `/best/survival-crafting-games`
  - `/best/dark-fantasy-rpg-games`
  - `/best/city-builder-games`
- Monitor:
  - indexed count
  - canonical warnings
  - duplicate/discovered-not-indexed states
  - impressions by page
  - queries that trigger each page

## Content Depth Upgrade

- Add more unique crawlable content to each `/best/*` page.
- Useful reusable sections:
  - `What Makes a Good [X] Game?`
  - `Good For Players Who Want...`
  - `Use These Filters`
  - `Related Game Moods`
  - `Start With These Search Combos`
- Keep copy practical and intent-matched. Avoid filler word count.

## Recommendation Snapshots

- Add cached game recommendation blocks for top-performing pages after the first SEO batch gets impressions.
- Generate snapshots from existing search/filter logic rather than calling IGDB during page render.
- Keep output crawlable:
  - game title
  - short reason it fits the intent
  - release year if available
  - CTA into the app for full results
- Do not add direct affiliate links to SEO pages until disclosure, tracking, and maintenance rules are clear.

## Internal Linking Expansion

- Add more crawlable internal links from relevant app surfaces:
  - homepage footer or discovery footer
  - empty states
  - result/info panels
  - saved/shared result surfaces where it does not distract from conversion
- Keep anchors descriptive, for example `cozy farming games`, not `learn more`.
- Link to canonical `/best/*` URLs, not query-param app URLs.

## Measurement

- Track the SEO funnel:
  - SEO page view
  - CTA click into app
  - hydrated search success
  - game card open
  - save game
  - share click
  - affiliate/store click
- Use page slug as an analytics dimension where possible.
- Judge pages by downstream store clicks, not impressions alone.

## Later Expansion

- Add `/keywords/:slug` pages only after `/best/*` pages prove indexable and useful.
- Add `/games-like/:slug` pages only when there is a reliable cached recommendation source.
- Consider generated category/subcategory pages for taxonomy coverage, but avoid thin pages that only list keywords.
