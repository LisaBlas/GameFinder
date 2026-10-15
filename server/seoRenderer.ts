import { type SeoPage, type SeoFilter, buildAppUrl, seoPagePath, SEO_PAGES, ALL_SEO_PAGES } from "./seoPages";
import { SEO_BASE_CSS } from "./seoStyles";
import type { CachedGame } from "../shared/schema.js";

const BASE_URL = "https://gamefinder-app.com";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function shortTitle(page: SeoPage): string {
  return page.title.split(page.kind === "like" ? ":" : "-")[0].trim();
}

function filterChipHtml(filter: SeoFilter): string {
  const kind = filter.category === "Keywords" ? "keyword" : "facet";
  const mode = filter.mode === "exclude" ? "exclude" : "include";
  const prefix = mode === "exclude" ? "Avoid" : filter.category === "Keywords" ? "Keyword" : filter.category;

  return `<li class="filter-chip filter-chip--${kind} filter-chip--${mode}">
    <span class="filter-chip__mark" aria-hidden="true"></span>
    <span><span class="filter-chip__kind">${escapeHtml(prefix)}</span>${escapeHtml(filter.name)}</span>
  </li>`;
}

function relatedLinkHtml(slug: string): string {
  const page = SEO_PAGES.find((candidate) => candidate.slug === slug);
  if (!page) return "";
  const label = shortTitle(page).replace(/^Best\s+/, "").replace(/\s+Games$/, "");

  return `<a href="${BASE_URL}${seoPagePath(page)}" class="related-link">
    <span>${escapeHtml(label)}</span><span aria-hidden="true">↗</span>
  </a>`;
}

function gameCardHtml(game: CachedGame, position: number): string {
  const name = escapeHtml(game.name);
  const coverImg = game.cover
    ? `<img class="game-cover" src="${escapeHtml(game.cover)}" alt="Cover art for ${name}" loading="lazy" width="96" height="128" />`
    : `<div class="game-cover game-cover--empty" aria-hidden="true"><span>GF</span></div>`;
  const ratingBadge = game.rating != null
    ? `<span class="game-rating" aria-label="Rated ${game.rating} out of 100"><strong>${game.rating}</strong><span>/100</span></span>`
    : `<span class="game-rating game-rating--unrated">Unrated</span>`;
  const summary = game.summary
    ? `<p class="game-summary">${escapeHtml(game.summary.slice(0, 220))}${game.summary.length > 220 ? "…" : ""}</p>`
    : `<p class="game-summary game-summary--empty">A highly rated match for this combination of filters.</p>`;

  return `<article class="game-card" itemscope itemtype="https://schema.org/VideoGame">
    <div class="game-rank" aria-label="Rank ${position}"><span>#</span>${position}</div>
    ${coverImg}
    <div class="game-info">
      <div class="game-heading">
        <h3 itemprop="name">${name}</h3>
        ${ratingBadge}
      </div>
      ${game.rating != null ? `<meta itemprop="aggregateRating" content="${game.rating}" />` : ""}
      ${summary}
    </div>
  </article>`;
}

function buildJsonLd(page: SeoPage, games?: CachedGame[]): string {
  const collectionPage: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.title,
    description: page.description,
    url: `${BASE_URL}${seoPagePath(page)}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: shortTitle(page), item: `${BASE_URL}${seoPagePath(page)}` },
      ],
    },
  };

  if (games && games.length > 0) {
    collectionPage.mainEntity = {
      "@type": "ItemList",
      numberOfItems: games.length,
      itemListElement: games.map((game, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "VideoGame",
          name: game.name,
          ...(game.cover ? { image: game.cover } : {}),
          ...(game.rating != null
            ? { aggregateRating: { "@type": "AggregateRating", ratingValue: game.rating, bestRating: 100 } }
            : {}),
        },
      })),
    };
  }

  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "GameFinder",
    url: BASE_URL,
    description: "Taste-first game discovery curated by mood, mechanics, setting, style, and precise keyword combinations.",
    applicationCategory: "GameApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return `<script type="application/ld+json">${safeJsonLd(collectionPage)}</script>\n<script type="application/ld+json">${safeJsonLd(webApp)}</script>`;
}

export function renderSeoPage(page: SeoPage, games?: CachedGame[]): string {
  const appUrl = buildAppUrl(page.filters);
  const canonicalUrl = `${BASE_URL}${seoPagePath(page)}`;
  const searchLabel = page.searchLabel ?? "Find these games";
  const filterChips = page.filters.map(filterChipHtml).join("\n");
  const relatedLinks = page.relatedSlugs.map(relatedLinkHtml).filter(Boolean).join("\n");
  const jsonLd = buildJsonLd(page, games);
  const hasGames = Boolean(games?.length);
  const gameListHtml = hasGames
    ? `<section class="games-section" id="top-picks" aria-labelledby="games-heading">
        <div class="section-heading">
          <div class="section-heading__title">
            <p class="eyebrow">The scrying pool reveals</p>
            <h2 id="games-heading">Top ${games!.length} matches</h2>
            <ul class="filter-list filter-list--results" aria-label="Filters used for these matches">
              ${filterChips}
            </ul>
          </div>
          <p class="section-note">Matched to every filter shown here, then ordered by player rating.</p>
        </div>
        <div class="games-grid">
          ${games!.map((game, index) => gameCardHtml(game, index + 1)).join("\n")}
        </div>
      </section>`
    : `<section class="empty-state" aria-labelledby="live-results-heading">
        <span class="empty-state__sigil" aria-hidden="true">✦</span>
        <div>
          <p class="eyebrow">Fresh results await</p>
          <h2 id="live-results-heading">Open this search in GameFinder</h2>
          <p>The full finder applies this exact recipe and lets you add, remove, or avoid keywords.</p>
          <ul class="filter-list filter-list--results" aria-label="Filters used for this search">
            ${filterChips}
          </ul>
        </div>
      </section>`;
  const titleEsc = escapeHtml(page.title);
  const descEsc = escapeHtml(page.description);
  const introEsc = escapeHtml(page.intro);
  const ctaLabelEsc = escapeHtml(searchLabel);
  const appUrlEsc = escapeHtml(appUrl);
  const analyticsSlug = JSON.stringify(page.slug).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#030807" />
  <title>${titleEsc}</title>
  <link rel="canonical" href="${canonicalUrl}" />
  <meta name="description" content="${descEsc}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="GameFinder" />
  <meta property="og:title" content="${titleEsc}" />
  <meta property="og:description" content="${descEsc}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${BASE_URL}/og-image.jpg" />
  <meta property="og:image:alt" content="GameFinder Wayfinder emblem with the message: Find games by what you actually enjoy" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="en_US" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${titleEsc}" />
  <meta name="twitter:description" content="${descEsc}" />
  <meta name="twitter:image" content="${BASE_URL}/og-image.jpg" />
  <meta name="twitter:image:alt" content="GameFinder Wayfinder emblem with the message: Find games by what you actually enjoy" />

  <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Brygada+1918:ital,wght@0,400;0,600;0,700;1,400&family=Castoro+Titling&family=Familjen+Grotesk:wght@400;500;600;700&family=Grenze:wght@500;600;700&display=swap" rel="stylesheet" />

  ${jsonLd}

  <style>
${SEO_BASE_CSS}
  </style>

  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P9PX4F6K2Y');
    window.addEventListener('load', function() {
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-P9PX4F6K2Y';
      document.head.appendChild(script);
      document.querySelectorAll('[data-seo-cta]').forEach(function(link) {
        link.addEventListener('click', function() {
          gtag('event', 'seo_open_app', {
            page_slug: ${analyticsSlug},
            cta_placement: link.getAttribute('data-seo-cta')
          });
        });
      });
    });
  </script>
</head>
<body>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="${BASE_URL}/" aria-label="GameFinder home">
        <span class="brand__name">GameFinder</span>
        <span class="brand__tagline">Find the game you mean</span>
      </a>
      <a class="header-link" href="${appUrlEsc}" data-seo-cta="header">Open the finder <span aria-hidden="true">→</span></a>
    </div>
  </header>

  <main class="page-wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${BASE_URL}/">GameFinder</a>
      <span class="breadcrumb__divider" aria-hidden="true">◆</span>
      <span>${escapeHtml(shortTitle(page))}</span>
    </nav>

    <section class="hero">
      <p class="eyebrow">A GameFinder field guide</p>
      <h1>${titleEsc}</h1>
      <p class="intro">${introEsc}</p>
      <div class="hero-actions">
        <a href="${appUrlEsc}" class="cta-button" data-seo-cta="hero" aria-label="${ctaLabelEsc} on GameFinder">
          <span>${ctaLabelEsc}</span><span class="cta-button__arrow" aria-hidden="true">→</span>
        </a>
        ${hasGames ? `<a class="jump-link" href="#top-picks">See the ranked matches ↓</a>` : ""}
      </div>
    </section>

    ${gameListHtml}

    <div class="lower-grid">
      <section aria-labelledby="related-heading">
        <p class="eyebrow">Continue exploring</p>
        <h2 id="related-heading">Nearby paths</h2>
        <p class="related-intro">Broaden the idea, change the mood, or follow a neighboring mechanic.</p>
        <div class="related-links" aria-label="Related game searches">
          ${relatedLinks}
        </div>
      </section>

      <aside class="method-card" aria-labelledby="method-heading">
        <p class="eyebrow">How this list works</p>
        <h2 id="method-heading">Focused, not generic</h2>
        <p class="method-copy">This is a starting point for a precise search—not a permanent editorial ranking.</p>
        <ol class="method-list">
          <li>Games match every included filter shown above.</li>
          <li>The shortlist is ordered by IGDB player rating.</li>
          <li>GameFinder lets you refine, exclude, and explore the full result set.</li>
        </ol>
      </aside>
    </div>

    <section class="cta-panel" aria-labelledby="cta-heading">
      <div>
        <p class="eyebrow">Make the search yours</p>
        <h2 id="cta-heading">Close, but not quite?</h2>
        <p>Add another mechanic, setting, mood, platform, or exclusion. The best discoveries usually live in the combination.</p>
      </div>
      <a href="${appUrlEsc}" class="cta-button" data-seo-cta="refine">
        <span>Refine this search</span><span class="cta-button__arrow" aria-hidden="true">→</span>
      </a>
    </section>

    <footer class="site-footer">
      Game data and ratings are sourced from IGDB. Rankings can change as ratings and the catalog evolve.<br />
      <a href="${BASE_URL}/">GameFinder</a> searches by the details that matter: mechanics, setting, mood, and style. <a href="${BASE_URL}/about">About</a>
    </footer>
  </main>
</body>
</html>`;
}

export function renderNotFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#030807" />
  <title>Page Not Found - GameFinder</title>
  <meta name="robots" content="noindex" />
  <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Brygada+1918:wght@600;700&family=Familjen+Grotesk:wght@400;600&family=Grenze:wght@600&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body { display: grid; min-height: 100vh; place-items: center; margin: 0; background: radial-gradient(circle at 50% 20%, rgba(32,230,167,.1), transparent 26rem), #030807; color: #f4f7f5; font-family: 'Familjen Grotesk', sans-serif; padding: 24px; text-align: center; }
    .panel { max-width: 540px; border: 1px solid rgba(168,128,63,.42); background: linear-gradient(145deg, rgba(12,24,21,.97), rgba(5,12,10,.98)); padding: clamp(36px, 8vw, 64px); box-shadow: 0 24px 70px rgba(0,0,0,.44); }
    .sigil { color: #f4b01b; font-size: 30px; }
    h1 { margin: 12px 0; font-family: Grenze, Georgia, serif; font-size: clamp(34px, 8vw, 48px); font-weight: 600; }
    p { margin: 0 0 28px; color: #9caeaa; line-height: 1.6; }
    a { display: inline-flex; min-height: 46px; align-items: center; border: 1px solid rgba(121,255,210,.7); border-radius: 2px; background: linear-gradient(180deg, #2cf0b1, #16bd88); color: #020706; padding: 0 20px; font-family: 'Brygada 1918', Georgia, serif; font-weight: 700; text-decoration: none; }
  </style>
</head>
<body>
  <main class="panel">
    <div class="sigil" aria-hidden="true">✦</div>
    <h1>The path ends here</h1>
    <p>This field guide does not exist. Return to GameFinder and chart a new search.</p>
    <a href="/">← Back to GameFinder</a>
  </main>
</body>
</html>`;
}

export function renderSitemap(): string {
  const now = new Date().toISOString().split("T")[0];
  const urls = [
    `  <url>\n    <loc>${BASE_URL}/</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    `  <url>\n    <loc>${BASE_URL}/about</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
    ...ALL_SEO_PAGES.map(
      (page) =>
        `  <url>\n    <loc>${BASE_URL}${seoPagePath(page)}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
}
