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

function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function shortTitle(page: SeoPage): string {
  return page.title.split("-")[0].trim();
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

  return `<a href="${BASE_URL}/best/${escapeHtml(slug)}" class="related-link">
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
    url: `${BASE_URL}/best/${page.slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: shortTitle(page), item: `${BASE_URL}/best/${page.slug}` },
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
  const canonicalUrl = `${BASE_URL}/best/${page.slug}`;
  const searchLabel = page.searchLabel ?? "Find these games";
  const filterChips = page.filters.map(filterChipHtml).join("\n");
  const relatedLinks = page.relatedSlugs.map(relatedLinkHtml).filter(Boolean).join("\n");
  const jsonLd = buildJsonLd(page, games);
  const hasGames = Boolean(games?.length);
  const gameListHtml = hasGames
    ? `<section class="games-section" id="top-picks" aria-labelledby="games-heading">
        <div class="section-heading">
          <div>
            <p class="eyebrow">The scrying pool reveals</p>
            <h2 id="games-heading">Top ${games!.length} matches</h2>
          </div>
          <p class="section-note">Matched to every filter below, then ordered by player rating.</p>
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
  <link href="https://fonts.googleapis.com/css2?family=Brygada+1918:ital,wght@0,400;0,600;0,700;1,400&family=Castoro+Titling&family=Familjen+Grotesk:wght@400;500;600;700&family=Grenze:wght@500;600;700&display=swap" rel="stylesheet" />

  ${jsonLd}

  <style>
    :root {
      color-scheme: dark;
      --bg: #030807;
      --surface: #07110f;
      --surface-2: #0b1815;
      --card: #111312;
      --emerald: #20e6a7;
      --emerald-soft: #79ffd2;
      --gold: #f4b01b;
      --gold-muted: #a8803f;
      --text: #f4f7f5;
      --muted: #9caeaa;
      --dim: #647570;
      --danger: #ff7b82;
      --display: 'Grenze', Georgia, serif;
      --ui: 'Brygada 1918', Georgia, serif;
      --body: 'Familjen Grotesk', system-ui, sans-serif;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      min-height: 100vh;
      margin: 0;
      background:
        radial-gradient(ellipse at 50% -10%, rgba(45, 212, 191, 0.1), transparent 38rem),
        linear-gradient(rgba(2, 7, 5, .86), rgba(2, 6, 5, .93)),
        url('/seo-assets/relic/raster/relic-chassis.webp') center top / 1100px auto repeat-y,
        #030706;
      color: var(--text);
      font-family: var(--body);
      -webkit-font-smoothing: antialiased;
    }
    body::before {
      position: fixed;
      inset: 0;
      z-index: -1;
      background: radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,.62) 100%);
      content: '';
      pointer-events: none;
    }
    a { color: inherit; }
    .site-header {
      border-bottom: 1px solid rgba(168, 128, 63, 0.22);
      background:
        linear-gradient(rgba(3, 8, 7, .9), rgba(3, 8, 7, .96)),
        url('/seo-assets/relic/raster/relic-chassis.webp') center 24% / cover;
      box-shadow: 0 8px 24px rgba(0,0,0,.42), inset 0 -1px 0 rgba(226,189,120,.08);
    }
    .site-header__inner {
      display: flex;
      width: min(1120px, calc(100% - 32px));
      min-height: 72px;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      margin: 0 auto;
    }
    .brand { text-decoration: none; }
    .brand__name {
      display: block;
      background: linear-gradient(180deg, #6b4f22 0%, #b48a45 30%, #f0cf8a 62%, #fff0c4 82%, #c99a52 100%);
      color: transparent;
      font-family: 'Castoro Titling', Georgia, serif;
      font-size: 20px;
      letter-spacing: .075em;
      line-height: 1;
      -webkit-background-clip: text;
      background-clip: text;
      filter: drop-shadow(0 -1px 0 #000) drop-shadow(0 1px 0 rgba(240,200,130,.18));
    }
    .brand__tagline { display: block; margin-top: 6px; color: var(--dim); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
    .header-link { color: #cbb47e; font-family: var(--ui); font-size: 14px; font-weight: 700; text-decoration: none; }
    .header-link:hover { color: var(--gold); }
    .page-wrap { width: min(1040px, calc(100% - 48px)); margin: 0 auto; padding: 34px 0 88px; }
    .breadcrumb { display: flex; align-items: center; gap: 9px; margin-bottom: 30px; color: var(--dim); font-size: 13px; }
    .breadcrumb a { text-decoration: none; }
    .breadcrumb a:hover { color: var(--emerald-soft); }
    .breadcrumb__divider { color: rgba(168,128,63,.55); }
    .hero {
      position: relative;
      isolation: isolate;
      border: 0;
      border-radius: 0;
      background:
        linear-gradient(90deg, rgba(4,10,8,.96) 0%, rgba(5,13,11,.92) 58%, rgba(4,10,8,.72) 100%),
        url('/seo-assets/wayfinder/wayfinder-divination-table-v2.webp') 112% 50% / 48% auto no-repeat,
        url('/seo-assets/relic/raster/map-field-v2.webp') center / cover,
        #070b0a;
      box-shadow: 0 24px 70px rgba(0,0,0,.58);
      padding: clamp(48px, 7vw, 76px) clamp(42px, 8vw, 88px);
    }
    .hero::before, .hero::after {
      position: absolute;
      content: '';
      pointer-events: none;
    }
    .hero::after {
      inset: -8px;
      z-index: 3;
      border: 88px solid transparent;
      border-image: url('/seo-assets/relic/raster/panel-frame-9slice.webp') 176 / 88px / 0 stretch;
      filter: brightness(.72) saturate(.68) drop-shadow(0 3px 5px rgba(0,0,0,.78));
      opacity: .9;
    }
    .hero::before {
      top: -21px;
      left: -21px;
      z-index: 4;
      width: 96px;
      height: 96px;
      background: url('/seo-assets/relic/raster/corner-medallion.webp') center / contain no-repeat;
      filter: brightness(.78) saturate(.76) drop-shadow(0 5px 8px rgba(0,0,0,.85));
    }
    .eyebrow { margin: 0 0 10px; color: #cbb47e; font-family: var(--ui); font-size: 12px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; }
    h1, h2, h3, p { margin-top: 0; }
    h1 {
      position: relative;
      z-index: 1;
      max-width: 720px;
      margin-bottom: 22px;
      font-family: var(--display);
      font-size: clamp(32px, 5vw, 50px);
      font-weight: 600;
      letter-spacing: .005em;
      line-height: 1.08;
      color: #e4dcc4;
      text-shadow: 0 2px 0 #000, 0 0 22px rgba(240,196,110,.08);
      text-wrap: balance;
    }
    .intro { position: relative; z-index: 1; max-width: 680px; margin-bottom: 30px; color: #a9a696; font-family: var(--ui); font-size: clamp(15px, 2vw, 18px); line-height: 1.72; }
    .hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 18px; }
    .cta-button {
      --cut: 13px;
      position: relative;
      isolation: isolate;
      display: inline-flex;
      min-height: 50px;
      align-items: center;
      gap: 12px;
      border: 0;
      border-radius: 0;
      background: linear-gradient(160deg, #ffe0a0, #b08848 38%, #5c4220 68%, #d0a458);
      clip-path: polygon(var(--cut) 0, calc(100% - var(--cut)) 0, 100% 50%, calc(100% - var(--cut)) 100%, var(--cut) 100%, 0 50%);
      box-shadow: none;
      color: #f0c46e;
      padding: 0 27px;
      font-family: var(--ui);
      font-size: 15px;
      font-weight: 700;
      letter-spacing: .025em;
      text-decoration: none;
      transition: transform .16s ease, box-shadow .16s ease, filter .16s ease;
    }
    .cta-button::before { position: absolute; inset: 1.5px; z-index: -1; background: linear-gradient(180deg, #161a17, #090d0b); clip-path: inherit; content: ''; }
    .cta-button:hover { filter: brightness(1.15); transform: translateY(-1px); }
    .cta-button:focus-visible, .related-link:focus-visible, .header-link:focus-visible, .brand:focus-visible { outline: 2px solid var(--emerald-soft); outline-offset: 4px; }
    .cta-button__arrow { font-family: var(--body); font-size: 19px; }
    .jump-link { color: #cbb47e; font-family: var(--ui); font-size: 14px; font-weight: 600; text-underline-offset: 4px; }
    .jump-link:hover { color: var(--gold); }
    .recipe {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(260px, .75fr);
      gap: 24px;
      margin: 18px 34px 64px;
      border: 24px solid transparent;
      border-image: url('/seo-assets/relic/raster/panel-frame-9slice.webp') 176 / 30px / 2px stretch;
      background:
        linear-gradient(rgba(5,11,9,.93), rgba(5,11,9,.96)),
        url('/seo-assets/relic/raster/relic-chassis.webp') center / cover;
      padding: 12px 18px;
      box-shadow: 0 16px 40px rgba(0,0,0,.42);
    }
    .recipe h2 { margin-bottom: 6px; font-family: var(--display); font-size: 23px; font-weight: 600; }
    .recipe__copy { margin: 0; color: var(--dim); font-size: 13px; line-height: 1.55; }
    .filter-list { display: flex; flex-wrap: wrap; align-content: flex-start; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .filter-chip { --chip-rgb: 48,112,83; --cut: 9px; position: relative; isolation: isolate; display: inline-flex; min-height: 36px; align-items: center; gap: 8px; border: 0; border-radius: 0; background: rgba(var(--chip-rgb),.7); clip-path: polygon(var(--cut) 0, calc(100% - var(--cut)) 0, 100% 50%, calc(100% - var(--cut)) 100%, var(--cut) 100%, 0 50%); color: #7fb39a; padding: 6px 15px; font-family: var(--ui); font-size: 14px; font-weight: 600; }
    .filter-chip::before { position: absolute; inset: 1.5px; z-index: -1; background: linear-gradient(180deg,#121816,#080d0b); clip-path: inherit; content: ''; }
    .filter-chip--facet { --chip-rgb: 168,128,63; color: #d2c29b; }
    .filter-chip--exclude { --chip-rgb: 150,65,70; color: #d8a4a4; }
    .filter-chip__mark { width: 6px; height: 6px; flex: 0 0 auto; border: 1px solid currentColor; transform: rotate(45deg); }
    .filter-chip__kind { display: block; margin-bottom: 1px; color: var(--dim); font-family: var(--body); font-size: 9px; font-weight: 700; letter-spacing: .1em; line-height: 1; text-transform: uppercase; }
    .games-section { margin-bottom: 64px; scroll-margin-top: 24px; }
    .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 28px; margin-bottom: 30px; padding: 0 18px 15px; border-bottom: 1px solid rgba(168,128,63,.32); box-shadow: 0 1px 0 rgba(0,0,0,.7); }
    .section-heading h2, .empty-state h2, .cta-panel h2 { margin-bottom: 0; font-family: var(--display); font-size: clamp(28px, 4vw, 38px); font-weight: 600; }
    .section-note { max-width: 390px; margin-bottom: 2px; color: var(--dim); font-size: 13px; line-height: 1.5; text-align: right; }
    .games-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 30px 28px; padding: 0 10px; }
    .game-card {
      position: relative;
      isolation: isolate;
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr);
      min-height: 160px;
      gap: 18px;
      border: 0;
      border-radius: 0;
      background:
        linear-gradient(135deg, rgba(17,19,18,.97), rgba(7,12,10,.98)),
        url('/seo-assets/stone-socket-floor.webp') center / 720px auto;
      padding: 20px;
      box-shadow: 0 12px 26px rgba(0,0,0,.48);
      transition: transform .18s ease, filter .18s ease;
    }
    .game-card:hover { transform: translateY(-2px); filter: brightness(1.06); }
    .game-card::before { position: absolute; inset: -5px; z-index: 3; border: 24px solid transparent; border-image: url('/seo-assets/game-card-frame-common.png') 128 / 24px / 2px stretch; content: ''; pointer-events: none; }
    .game-card::after { position: absolute; left: 50%; bottom: -16px; z-index: 4; width: 30px; height: 30px; background: url('/seo-assets/card-socket-seal.webp') center / contain no-repeat; content: ''; filter: brightness(.78) saturate(.75) drop-shadow(0 2px 2px #000); transform: translateX(-50%); pointer-events: none; }
    .game-rank { position: absolute; top: 6px; left: 7px; z-index: 5; display: flex; min-width: 30px; height: 30px; align-items: baseline; justify-content: center; border: 1px solid rgba(226,189,120,.52); border-radius: 50%; background: radial-gradient(circle at 40% 35%, #2e281b, #090b09 72%); color: #f0c46e; font-family: var(--ui); font-size: 14px; font-weight: 700; box-shadow: inset 0 0 0 2px #080a08, 0 3px 12px rgba(0,0,0,.7); }
    .game-rank span { color: var(--gold-muted); font-size: 9px; }
    .game-cover { width: 96px; height: 128px; align-self: start; border: 2px solid #5f4a29; border-radius: 0; background: var(--surface-2); object-fit: cover; box-shadow: 0 0 0 1px #090b09, 0 8px 18px rgba(0,0,0,.5); }
    .game-cover--empty { display: grid; place-items: center; background: radial-gradient(circle, rgba(32,230,167,.1), transparent 66%), var(--surface); color: rgba(168,128,63,.45); font-family: 'Castoro Titling', serif; font-size: 18px; }
    .game-info { min-width: 0; padding: 4px 4px 2px 0; }
    .game-heading { display: flex; align-items: start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
    .game-heading h3 { margin-bottom: 0; color: #d9d2bd; font-family: var(--ui); font-size: 18px; font-weight: 700; line-height: 1.25; text-shadow: 0 1px 0 #000; }
    .game-rating { display: inline-flex; flex: 0 0 auto; align-items: baseline; gap: 2px; border: 0; border-bottom: 1px solid rgba(48,112,83,.58); border-radius: 0; background: none; color: #6f9f89; padding: 2px 3px; font-size: 10px; }
    .game-rating strong { font-size: 13px; }
    .game-rating--unrated { color: var(--dim); }
    .game-summary { margin-bottom: 0; color: #969486; font-family: var(--ui); font-size: 13px; line-height: 1.55; }
    .game-summary--empty { color: var(--dim); font-style: italic; }
    .empty-state { display: flex; align-items: center; gap: 22px; margin-bottom: 56px; border: 30px solid transparent; border-image: url('/seo-assets/relic/raster/panel-frame-9slice.webp') 176 / 36px / 3px stretch; background: linear-gradient(rgba(5,11,9,.92),rgba(5,11,9,.96)), url('/seo-assets/relic/raster/relic-chassis.webp') center / cover; padding: 10px 18px; box-shadow: 0 16px 38px rgba(0,0,0,.42); }
    .empty-state__sigil { color: var(--gold); font-size: 34px; filter: drop-shadow(0 0 12px rgba(244,176,27,.28)); }
    .empty-state p:last-child { margin: 8px 0 0; color: var(--muted); }
    .lower-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, .68fr); gap: 36px; align-items: start; padding: 34px; border: 38px solid transparent; border-image: url('/seo-assets/relic/raster/panel-frame-9slice.webp') 176 / 44px / 3px stretch; background: linear-gradient(rgba(5,11,9,.92),rgba(5,11,9,.96)), url('/seo-assets/relic/raster/relic-chassis.webp') center / cover; box-shadow: 0 20px 46px rgba(0,0,0,.45); }
    .lower-grid h2 { margin-bottom: 8px; font-family: var(--display); font-size: 28px; font-weight: 600; }
    .related-intro, .method-copy { color: var(--dim); font-size: 14px; line-height: 1.6; }
    .related-links { display: grid; gap: 8px; margin-top: 18px; }
    .related-link { display: flex; min-height: 45px; align-items: center; justify-content: space-between; gap: 14px; border-bottom: 1px solid rgba(168,128,63,.18); color: #d2c29b; font-family: var(--ui); font-weight: 600; text-decoration: none; transition: color .16s ease, padding .16s ease, border-color .16s ease; }
    .related-link:hover { border-color: rgba(32,230,167,.35); color: var(--emerald-soft); padding-left: 6px; }
    .method-card { border: 1px solid rgba(168,128,63,.28); border-radius: 0; background: linear-gradient(145deg, rgba(14,20,17,.9), rgba(5,10,8,.94)); padding: 24px; box-shadow: inset 0 0 20px rgba(0,0,0,.38); }
    .method-list { display: grid; gap: 16px; margin: 20px 0 0; padding: 0; list-style: none; counter-reset: method; }
    .method-list li { position: relative; padding-left: 34px; color: var(--muted); font-size: 13px; line-height: 1.5; counter-increment: method; }
    .method-list li::before { position: absolute; top: 0; left: 0; display: grid; width: 22px; height: 22px; place-items: center; border: 1px solid rgba(168,128,63,.42); color: var(--gold); content: counter(method); font-family: var(--ui); font-size: 11px; transform: rotate(45deg); }
    .method-list li span { display: inline-block; transform: none; }
    .cta-panel { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 28px; margin-top: 64px; border: 34px solid transparent; border-image: url('/seo-assets/relic/raster/panel-frame-9slice.webp') 176 / 40px / 3px stretch; background: linear-gradient(90deg,rgba(6,13,11,.96),rgba(6,13,11,.78)), url('/seo-assets/wayfinder/wayfinder-divination-table-v2.webp') 105% 50% / 280px auto no-repeat, #07110f; padding: 16px 24px; box-shadow: 0 18px 42px rgba(0,0,0,.46); }
    .cta-panel::before { display: none; }
    .cta-panel p:last-child { max-width: 580px; margin: 8px 0 0; color: var(--muted); line-height: 1.55; }
    .site-footer { margin-top: 48px; color: var(--dim); font-size: 12px; line-height: 1.6; text-align: center; }
    .site-footer a { color: #cbb47e; text-underline-offset: 3px; }
    @media (max-width: 820px) {
      .recipe, .lower-grid { grid-template-columns: 1fr; }
      .games-grid { grid-template-columns: 1fr; }
      .section-heading { align-items: start; flex-direction: column; gap: 4px; }
      .section-note { text-align: left; }
      .cta-panel { align-items: flex-start; flex-direction: column; }
    }
    @media (max-width: 560px) {
      .site-header__inner, .page-wrap { width: min(100% - 24px, 1040px); }
      .site-header__inner { min-height: 64px; }
      .brand__tagline { display: none; }
      .header-link { font-size: 13px; }
      .page-wrap { padding-top: 22px; }
      .breadcrumb { margin-bottom: 20px; font-size: 12px; }
      .hero { padding: 46px 30px 40px; }
      .hero::before { top: -14px; left: -14px; width: 74px; height: 74px; }
      h1 { font-size: clamp(30px, 10vw, 40px); }
      .hero-actions { align-items: stretch; flex-direction: column; }
      .cta-button { justify-content: center; }
      .jump-link { text-align: center; }
      .recipe { margin: 14px 8px 48px; padding: 12px; }
      .game-card { grid-template-columns: 78px minmax(0, 1fr); gap: 14px; min-height: 136px; padding: 12px; }
      .game-cover { width: 78px; height: 108px; }
      .game-heading { flex-direction: column; gap: 7px; }
      .game-heading h3 { font-size: 16px; }
      .game-summary { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
      .empty-state { align-items: flex-start; }
      .lower-grid { padding: 20px 14px; }
      .cta-panel { padding: 14px 8px; }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      *, *::before, *::after { transition-duration: .01ms !important; }
    }
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

    <section class="recipe" aria-labelledby="recipe-heading">
      <div>
        <p class="eyebrow">Search recipe</p>
        <h2 id="recipe-heading">Why these games fit</h2>
        <p class="recipe__copy">Every result must match this combination. Open it in the finder to tune the recipe further.</p>
      </div>
      <ul class="filter-list" aria-label="Active search filters">
        ${filterChips}
      </ul>
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
      <a href="${BASE_URL}/">GameFinder</a> searches by the details that matter: mechanics, setting, mood, and style.
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
  <link rel="icon" href="/favicon.png" type="image/png" />
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
    ...SEO_PAGES.map(
      (page) =>
        `  <url>\n    <loc>${BASE_URL}/best/${page.slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
}
