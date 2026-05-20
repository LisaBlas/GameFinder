import { type SeoPage, type SeoFilter, buildAppUrl, SEO_PAGES } from "./seoPages";
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

function filterChipHtml(filter: SeoFilter): string {
  const isKeyword = filter.category === "Keywords";
  const bg = isKeyword ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.07)";
  const border = isKeyword ? "#10b981" : "rgba(255,255,255,0.15)";
  const color = isKeyword ? "#34d399" : "#9caeaa";
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;border:1px solid ${border};background:${bg};color:${color};font-size:13px;font-family:Inter,sans-serif;margin:4px;">${escapeHtml(filter.name)}</span>`;
}

function relatedLinkHtml(slug: string): string {
  const page = SEO_PAGES.find((p) => p.slug === slug);
  if (!page) return "";
  const label = page.title.split("-")[0].trim().replace(/^Best\s+/, "").replace(/\s+Games$/, "");
  return `<a href="${BASE_URL}/best/${escapeHtml(slug)}" style="display:inline-block;padding:6px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);color:#9caeaa;font-size:13px;text-decoration:none;margin:4px;transition:border-color 0.2s,color 0.2s;" onmouseover="this.style.borderColor='#10b981';this.style.color='#34d399';" onmouseout="this.style.borderColor='rgba(255,255,255,0.12)';this.style.color='#9caeaa';">${escapeHtml(label)}</a>`;
}

function gameCardHtml(game: CachedGame, position: number): string {
  const coverImg = game.cover
    ? `<img class="game-cover" src="${escapeHtml(game.cover)}" alt="${escapeHtml(game.name)} cover" loading="lazy" width="72" height="96" />`
    : `<div class="game-cover-placeholder"></div>`;
  const ratingBadge = game.rating != null
    ? `<span class="game-rating">${game.rating}</span>`
    : "";
  const summary = game.summary
    ? `<p class="game-summary">${escapeHtml(game.summary.slice(0, 160))}${game.summary.length > 160 ? "…" : ""}</p>`
    : "";
  return `<div class="game-card" itemscope itemtype="https://schema.org/VideoGame" data-position="${position}">
      ${coverImg}
      <div class="game-info">
        <div class="game-title-text">
          <span itemprop="name">${escapeHtml(game.name)}</span>${ratingBadge}
        </div>
        ${summary}
      </div>
    </div>`;
}

function buildJsonLd(page: SeoPage, appUrl: string, games?: CachedGame[]): string {
  const collectionPage: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.title,
    description: page.description,
    url: `${BASE_URL}/best/${page.slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: page.title.split("-")[0].trim(), item: `${BASE_URL}/best/${page.slug}` },
      ],
    },
  };

  if (games && games.length > 0) {
    collectionPage.mainEntity = {
      "@type": "ItemList",
      numberOfItems: games.length,
      itemListElement: games.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: g.name,
      })),
    };
  }

  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "GameFinder",
    url: BASE_URL,
    description: "Discover your next favorite game with ultra-specific keyword and filter search.",
    applicationCategory: "GameApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return `<script type="application/ld+json">${JSON.stringify(collectionPage)}</script>\n<script type="application/ld+json">${JSON.stringify(webApp)}</script>`;
}

export function renderSeoPage(page: SeoPage, games?: CachedGame[]): string {
  const appUrl = buildAppUrl(page.filters);
  const fullAppUrl = `${BASE_URL}${appUrl}`;
  const canonicalUrl = `${BASE_URL}/best/${page.slug}`;
  const searchLabel = page.searchLabel ?? "Find these games";

  const filterChips = page.filters.map(filterChipHtml).join("\n");
  const relatedLinks = page.relatedSlugs.map(relatedLinkHtml).join("\n");
  const jsonLd = buildJsonLd(page, appUrl, games);
  const gameListHtml = games && games.length > 0
    ? `<div class="games-section">
      <p class="section-label">Top games</p>
      ${games.map((g, i) => gameCardHtml(g, i + 1)).join("\n")}
    </div>`
    : "";
  const titleEsc = escapeHtml(page.title);
  const descEsc = escapeHtml(page.description);
  const introEsc = escapeHtml(page.intro);
  const ctaLabelEsc = escapeHtml(searchLabel);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="en_US" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${titleEsc}" />
  <meta name="twitter:description" content="${descEsc}" />
  <meta name="twitter:image" content="${BASE_URL}/og-image.jpg" />

  <link rel="icon" href="/favicon.png" type="image/png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Metamorphous&display=swap" rel="stylesheet" />

  ${jsonLd}

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #030807;
      color: #f4f7f5;
      font-family: Inter, sans-serif;
      min-height: 100vh;
      padding: 0 16px;
    }
    .page-wrap {
      max-width: 720px;
      margin: 0 auto;
      padding: 48px 0 80px;
    }
    .breadcrumb {
      font-size: 13px;
      color: #647570;
      margin-bottom: 32px;
    }
    .breadcrumb a {
      color: #647570;
      text-decoration: none;
    }
    .breadcrumb a:hover { color: #10b981; }
    .breadcrumb span { margin: 0 6px; }
    h1 {
      font-family: Metamorphous, serif;
      font-size: clamp(22px, 5vw, 32px);
      font-weight: 400;
      color: #f4f7f5;
      line-height: 1.25;
      margin-bottom: 20px;
    }
    .intro {
      font-size: 16px;
      line-height: 1.7;
      color: #9caeaa;
      margin-bottom: 32px;
    }
    .section-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #647570;
      margin-bottom: 12px;
    }
    .chips-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 36px;
    }
    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      background: #10b981;
      color: #030807;
      font-family: Inter, sans-serif;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 10px;
      transition: background 0.2s, transform 0.1s;
      margin-bottom: 48px;
    }
    .cta-button:hover { background: #34d399; transform: translateY(-1px); }
    .cta-button:active { transform: translateY(0); }
    .divider {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.07);
      margin: 0 0 32px;
    }
    .related-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #647570;
      margin-bottom: 14px;
    }
    .related-links {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .footer-note {
      margin-top: 48px;
      font-size: 12px;
      color: #647570;
      text-align: center;
    }
    .footer-note a { color: #10b981; text-decoration: none; }
    .footer-note a:hover { text-decoration: underline; }
    .games-section { margin-bottom: 40px; }
    .game-card {
      display: flex;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .game-card:first-of-type { border-top: 1px solid rgba(255,255,255,0.06); }
    .game-cover {
      width: 72px;
      height: 96px;
      object-fit: cover;
      border-radius: 6px;
      flex-shrink: 0;
      background: rgba(255,255,255,0.05);
    }
    .game-cover-placeholder {
      width: 72px;
      height: 96px;
      border-radius: 6px;
      background: rgba(255,255,255,0.05);
      flex-shrink: 0;
    }
    .game-info { flex: 1; min-width: 0; }
    .game-title-text {
      font-size: 15px;
      font-weight: 600;
      color: #f4f7f5;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .game-rating {
      font-size: 12px;
      font-weight: 600;
      color: #10b981;
      background: rgba(16,185,129,0.12);
      border-radius: 4px;
      padding: 1px 6px;
    }
    .game-summary {
      font-size: 13px;
      line-height: 1.55;
      color: #647570;
      margin-top: 4px;
    }
  </style>

  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P9PX4F6K2Y');
    window.addEventListener('load', function() {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=G-P9PX4F6K2Y';
      document.head.appendChild(s);
    });
    function trackCtaClick() {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'seo_open_app', { page_slug: '${escapeHtml(page.slug)}' });
      }
    }
  </script>
</head>
<body>
  <div class="page-wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${BASE_URL}/">GameFinder</a>
      <span aria-hidden="true">></span>
      <span>${escapeHtml(page.title.split("-")[0].trim())}</span>
    </nav>

    <h1>${titleEsc}</h1>
    <p class="intro">${introEsc}</p>

    ${gameListHtml}

    <p class="section-label">Active filters</p>
    <div class="chips-wrap" aria-label="Selected filters">
      ${filterChips}
    </div>

    <a href="${appUrl}" class="cta-button" onclick="trackCtaClick()" aria-label="${ctaLabelEsc} on GameFinder">
      ${ctaLabelEsc} ->
    </a>

    <hr class="divider" />

    <p class="related-label">Related searches</p>
    <div class="related-links" aria-label="Related game categories">
      ${relatedLinks}
    </div>

    <p class="footer-note">
      Results are curated by <a href="${BASE_URL}/">GameFinder</a> - discover games by what actually matters to you.
    </p>
  </div>
</body>
</html>`;
}

export function renderNotFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page Not Found - GameFinder</title>
  <meta name="robots" content="noindex" />
  <link rel="icon" href="/favicon.png" type="image/png" />
  <style>
    body { background:#030807; color:#f4f7f5; font-family:Inter,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; text-align:center; padding:24px; }
    h1 { font-size:24px; margin-bottom:12px; }
    p { color:#9caeaa; margin-bottom:24px; }
    a { color:#10b981; text-decoration:none; }
    a:hover { text-decoration:underline; }
  </style>
</head>
<body>
  <div>
    <h1>Page not found</h1>
    <p>This page doesn't exist. Try exploring games directly.</p>
    <a href="/"><- Back to GameFinder</a>
  </div>
</body>
</html>`;
}

export function renderSitemap(): string {
  const now = new Date().toISOString().split("T")[0];
  const urls = [
    `  <url>\n    <loc>${BASE_URL}/</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...SEO_PAGES.map(
      (p) =>
        `  <url>\n    <loc>${BASE_URL}/best/${p.slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
}
