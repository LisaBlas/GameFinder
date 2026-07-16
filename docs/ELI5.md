# ELI5

GameFinder is a website that helps someone find video games by describing the
*vibe* they want ("cozy farming," "souls-like," "memory loss horror") instead
of picking a genre from a dropdown. You tap curated keywords, the app queries
IGDB (a game database) for matches, and results come back as cards with
covers, ratings, trailers, and store links.

Two halves of the app:
- **The React SPA** (`client/`) — the interactive keyword-picker and results
  browser most visitors use.
- **Server-rendered SEO pages** (`server/seoRenderer.ts`, `/best/:slug`) —
  plain crawlable HTML pages (no React) targeting specific search intents
  ("best cozy farming games"), so Google can index curated lists directly.
  This is the main organic-traffic driver.

Revenue path: game cards link out to official stores plus affiliate
marketplaces (Eneba, G2A, Kinguin, Instant Gaming) with rotated partner links.
