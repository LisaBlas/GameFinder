import { ALL_SEO_PAGES } from "./seoPages";
import { SEO_BASE_CSS } from "./seoStyles";

const BASE_URL = "https://gamefinder-app.com";
const ABOUT_URL = `${BASE_URL}/about`;
const REPO_URL = "https://github.com/LisaBlas/GameFinder";
const TITLE = "About GameFinder - Free Game Discovery by Mood, Mechanics and Setting";
const DESCRIPTION =
  "GameFinder is a free web app that finds video games by vibe. Combine curated keywords like cozy, souls-like or memory loss with genre and platform filters. Data from IGDB.";

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

interface Faq {
  q: string;
  a: string;
}

// Plain-text answers: the same strings feed the visible FAQ and the FAQPage JSON-LD,
// so the page and its structured data cannot drift apart.
const FAQS: Faq[] = [
  {
    q: "What is GameFinder?",
    a: "GameFinder is a free web app that finds video games by the feel you want, such as cozy farming, souls-like or memory loss horror, instead of by genre alone. You pick curated keywords and filters, and it returns matching games with covers, ratings, trailers and store links.",
  },
  {
    q: "Is GameFinder free? Do I need an account?",
    a: "GameFinder is free to use and has no accounts or sign-ups. Games you save are stored in your own browser, on your own device.",
  },
  {
    q: "Where does the game data come from?",
    a: "Game data and player ratings come from IGDB, a public video game database. GameFinder adds its own curated keyword layer and search logic on top.",
  },
  {
    q: "How is GameFinder different from a normal game list or a store search?",
    a: "Store search and genre lists answer 'what exists'. GameFinder answers 'what feels like this'. It matches games on several chosen keywords at once, can exclude things you want to avoid, and shows why each game matched.",
  },
  {
    q: "How does GameFinder make money?",
    a: "Game cards link to official stores and to partner marketplaces. Some partner links are affiliate links, so GameFinder may earn a commission on a purchase. This does not change the price you pay and does not change which games are matched.",
  },
  {
    q: "Which platforms does GameFinder cover?",
    a: "You can filter by PC, PlayStation, Xbox, Nintendo, mobile, VR, arcade, Sega, cloud gaming and indie hardware. GameFinder itself runs in any modern web browser on desktop or mobile.",
  },
  {
    q: "Can I get a game recommendation without picking keywords?",
    a: "Yes. Search for a game you like and GameFinder builds a starting search from its keywords, genre and theme. The 'Need a spark?' Wayfinder also draws a destination for you, such as a popular, random or hidden keyword combination.",
  },
];

const SERVICES: { title: string; body: string }[] = [
  {
    title: "Keyword search",
    body: "Build a search from more than 5,000 searchable keywords covering mechanics, setting, mood and style. Add keywords to include them, or avoid them to remove games that do not fit.",
  },
  {
    title: "Keyword map",
    body: "Explore keywords as a connected map. Click a node to recenter on it, then add or avoid it. Exploring never changes your search by itself.",
  },
  {
    title: "Wayfinder",
    body: "Stuck for ideas? Draw a destination from popular, curated, random or hidden keyword combinations, and open it as a live search.",
  },
  {
    title: "Find similar games",
    body: "Start from a game you already love. GameFinder reads its keywords, genre and theme and turns them into a search.",
  },
  {
    title: "Game cards",
    body: "Each result shows rating, trailer, synopsis, platforms and the reason it matched. Official store links come first, with partner marketplaces after.",
  },
  {
    title: "Curated guides",
    body: `${ALL_SEO_PAGES.length} written guides, such as best cozy games or games like a favourite title. Each is a plain web page that opens as a full search.`,
  },
];

const DIFFERENTIATORS: { title: string; body: string }[] = [
  {
    title: "Vibe first, not genre first",
    body: "Genres are broad. Keywords such as a mechanic, a mood or a setting find games a genre list hides.",
  },
  {
    title: "Curated, not a database dump",
    body: "Keywords are chosen and ordered by hand. The order and meaning are editorial decisions, not an automatic sort.",
  },
  {
    title: "Combinations, not single tags",
    body: "The best finds sit where several keywords meet. A narrow combination often shows only a few games, which suits niche taste.",
  },
  {
    title: "It shows why a game matched",
    body: "Expanded cards list the exact filters each game satisfied, so a result never feels random.",
  },
  {
    title: "Honest links",
    body: "Official stores come first. Partner links are marked by position and do not change the match list.",
  },
];

const AUDIENCES: { title: string; body: string }[] = [
  {
    title: "Players with specific taste",
    body: "People who know the feeling they want, such as a calm crafting loop or a bleak mystery, but not the title.",
  },
  {
    title: "Players who finished a favourite",
    body: "People who ask 'what do I play after this?' and want more of the same feel.",
  },
  {
    title: "Niche and indie fans",
    body: "People who already know the big hits and want less obvious games.",
  },
  {
    title: "Gift buyers and parents",
    body: "People who choose a game for someone else and can describe the person better than the game.",
  },
];

const PROCESS: string[] = [
  "You choose keywords and filters. Keywords describe the feel. Filters set genre, theme, platform, mode and perspective.",
  "GameFinder sends the search to IGDB and keeps only games that match every included keyword and none of the avoided ones.",
  "Results come back as cards with player rating, trailer and the reasons each game matched.",
  "Curated guide pages are refreshed from the same data, so a guide is a saved search and not a fixed opinion.",
];

const KEY_FACTS: [string, string][] = [
  ["Name", "GameFinder"],
  ["Type", "Web application for video game discovery and recommendation"],
  ["Website", BASE_URL],
  ["Price", "Free"],
  ["Account required", "No"],
  ["Core idea", "Search for games by mood, mechanics, setting and style using curated keywords"],
  ["Search inputs", "Keywords (include and avoid), genre, theme, platform, game mode, player perspective"],
  ["Searchable keywords", "More than 5,000"],
  ["Platform filters", "PC, PlayStation, Xbox, Nintendo, mobile, VR, arcade, Sega, cloud gaming, indie hardware"],
  ["Game data source", "IGDB"],
  ["Rating source", "IGDB player ratings"],
  ["Result content", "Cover, rating, trailer, synopsis, platforms, genres, themes, match reasons, store links"],
  ["Written guides", `${ALL_SEO_PAGES.length} server-rendered pages under /best/ and /games-like/`],
  ["Revenue model", "Affiliate commissions from partner marketplaces"],
  ["Saved data", "Saved games stay in the visitor's own browser"],
  ["Language", "English"],
  ["Source code", REPO_URL],
];

function cardsHtml(items: { title: string; body: string }[], className: string): string {
  return items
    .map(
      (item) => `<li class="${className}">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.body)}</p>
        </li>`
    )
    .join("\n        ");
}

function buildJsonLd(): string {
  const app = {
    "@type": "WebApplication",
    "@id": `${BASE_URL}/#app`,
    name: "GameFinder",
    url: BASE_URL,
    description: DESCRIPTION,
    applicationCategory: "GameApplication",
    operatingSystem: "All",
    browserRequirements: "Requires a modern web browser",
    inLanguage: "en",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    sameAs: [REPO_URL],
  };
  const aboutPage = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: TITLE,
    url: ABOUT_URL,
    description: DESCRIPTION,
    mainEntity: app,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
        { "@type": "ListItem", position: 2, name: "About", item: ABOUT_URL },
      ],
    },
  };
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
  return `<script type="application/ld+json">${safeJsonLd(aboutPage)}</script>\n<script type="application/ld+json">${safeJsonLd(faqPage)}</script>`;
}

const ABOUT_CSS = `
    .about-hero .intro { max-width: 700px; }
    .about-nav { display: flex; flex-wrap: wrap; gap: 6px 20px; margin: 26px 0 0; padding: 0; list-style: none; position: relative; z-index: 1; }
    .about-nav a { color: #cbb47e; font-family: var(--ui); font-size: 13px; font-weight: 600; text-decoration: none; }
    .about-nav a:hover { color: var(--gold); }
    .about-section { margin: 0 0 56px; scroll-margin-top: 24px; }
    .about-section > .section-heading { margin-bottom: 24px; }
    .about-lede { max-width: 720px; margin: 0 0 22px; color: #a9a696; font-family: var(--ui); font-size: 16px; line-height: 1.7; }
    .about-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; margin: 0; padding: 0; list-style: none; }
    .about-card { position: relative; border: 1px solid rgba(168,128,63,.28); background: linear-gradient(145deg, rgba(14,20,17,.9), rgba(5,10,8,.94)); padding: 22px 22px 20px; box-shadow: inset 0 0 20px rgba(0,0,0,.38); }
    .about-card h3 { margin: 0 0 8px; color: #d9d2bd; font-family: var(--ui); font-size: 18px; font-weight: 700; line-height: 1.25; }
    .about-card p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.6; }
    .about-panel { padding: 34px; border: 38px solid transparent; border-image: url('/seo-assets/relic/raster/panel-frame-9slice.webp') 176 / 44px / 3px stretch; background: linear-gradient(rgba(5,11,9,.92), rgba(3,8,7,.96)); }
    .about-panel h3 { margin: 0 0 8px; font-family: var(--display); font-size: 24px; font-weight: 600; }
    .about-panel p { color: var(--muted); font-size: 15px; line-height: 1.65; }
    .about-panel p:last-child { margin-bottom: 0; }
    .facts-wrap { overflow-x: auto; border: 1px solid rgba(168,128,63,.28); background: linear-gradient(145deg, rgba(14,20,17,.9), rgba(5,10,8,.94)); box-shadow: inset 0 0 20px rgba(0,0,0,.38); }
    .facts-table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.55; }
    .facts-table caption { padding: 16px 20px 6px; color: var(--dim); font-size: 12px; text-align: left; }
    .facts-table th, .facts-table td { padding: 12px 20px; border-top: 1px solid rgba(168,128,63,.18); text-align: left; vertical-align: top; }
    .facts-table th { width: 30%; min-width: 150px; color: #cbb47e; font-family: var(--ui); font-weight: 700; }
    .facts-table td { color: var(--text); }
    .facts-table a { color: var(--emerald-soft); text-underline-offset: 3px; }
    .faq-list { display: grid; gap: 10px; }
    .faq-item { border: 1px solid rgba(168,128,63,.28); background: linear-gradient(145deg, rgba(14,20,17,.9), rgba(5,10,8,.94)); }
    .faq-item summary { display: flex; min-height: 54px; align-items: center; justify-content: space-between; gap: 16px; cursor: pointer; padding: 12px 20px; color: #d9d2bd; font-family: var(--ui); font-size: 16px; font-weight: 700; list-style: none; }
    .faq-item summary::-webkit-details-marker { display: none; }
    .faq-item summary::after { color: var(--gold); content: '+'; font-size: 20px; }
    .faq-item[open] summary::after { content: '\\2212'; }
    .faq-item summary:hover { color: var(--emerald-soft); }
    .faq-item summary:focus-visible { outline: 2px solid var(--emerald-soft); outline-offset: -2px; }
    .faq-item p { margin: 0; padding: 0 20px 18px; color: var(--muted); font-size: 14px; line-height: 1.65; }
    .about-note { margin: 14px 0 0; color: var(--dim); font-size: 12px; }
    @media (max-width: 560px) {
      .about-panel { padding: 20px 14px; }
      .facts-table th, .facts-table td { display: block; width: auto; padding: 4px 16px; }
      .facts-table th { padding-top: 12px; border-top: 1px solid rgba(168,128,63,.18); }
      .facts-table td { padding-bottom: 12px; border-top: 0; }
    }
`;

export function renderAboutPage(): string {
  const titleEsc = escapeHtml(TITLE);
  const descEsc = escapeHtml(DESCRIPTION);
  const factsRows = KEY_FACTS.map(([label, value]) => {
    const valueHtml = value.startsWith("https://")
      ? `<a href="${escapeHtml(value)}">${escapeHtml(value)}</a>`
      : escapeHtml(value);
    return `<tr><th scope="row">${escapeHtml(label)}</th><td>${valueHtml}</td></tr>`;
  }).join("\n            ");
  const faqHtml = FAQS.map(
    (faq) => `<details class="faq-item">
          <summary>${escapeHtml(faq.q)}</summary>
          <p>${escapeHtml(faq.a)}</p>
        </details>`
  ).join("\n        ");
  const processHtml = PROCESS.map((step) => `<li>${escapeHtml(step)}</li>`).join("\n            ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#030807" />
  <title>${titleEsc}</title>
  <link rel="canonical" href="${ABOUT_URL}" />
  <meta name="description" content="${descEsc}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="GameFinder" />
  <meta property="og:title" content="${titleEsc}" />
  <meta property="og:description" content="${descEsc}" />
  <meta property="og:url" content="${ABOUT_URL}" />
  <meta property="og:image" content="${BASE_URL}/og-image.jpg" />
  <meta property="og:image:alt" content="GameFinder Wayfinder emblem with the message: Find games by what you actually enjoy" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="en_US" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${titleEsc}" />
  <meta name="twitter:description" content="${descEsc}" />
  <meta name="twitter:image" content="${BASE_URL}/og-image.jpg" />

  <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Brygada+1918:ital,wght@0,400;0,600;0,700;1,400&family=Castoro+Titling&family=Familjen+Grotesk:wght@400;500;600;700&family=Grenze:wght@500;600;700&display=swap" rel="stylesheet" />

  ${buildJsonLd()}

  <style>
${SEO_BASE_CSS}
${ABOUT_CSS}
  </style>
</head>
<body>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="${BASE_URL}/" aria-label="GameFinder home">
        <span class="brand__name">GameFinder</span>
        <span class="brand__tagline">Find the game you mean</span>
      </a>
      <a class="header-link" href="${BASE_URL}/">Open the finder <span aria-hidden="true">→</span></a>
    </div>
  </header>

  <main class="page-wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${BASE_URL}/">GameFinder</a>
      <span class="breadcrumb__divider" aria-hidden="true">◆</span>
      <span>About</span>
    </nav>

    <section class="hero about-hero" id="value" aria-labelledby="about-heading">
      <p class="eyebrow">About GameFinder</p>
      <h1 id="about-heading">Find the game you mean, not just the genre you know</h1>
      <p class="intro">GameFinder is a free web app that finds video games by feel. Describe the mood, mechanics, setting and style you want, such as cozy farming, souls-like or memory loss horror, and get a ranked list of games that match every part of it.</p>
      <div class="hero-actions">
        <a href="${BASE_URL}/" class="cta-button"><span>Start a search</span><span class="cta-button__arrow" aria-hidden="true">→</span></a>
        <a class="jump-link" href="#key-facts">Jump to key facts ↓</a>
      </div>
      <ul class="about-nav" aria-label="On this page">
        <li><a href="#services">What it offers</a></li>
        <li><a href="#differentiators">What makes it different</a></li>
        <li><a href="#audience">Who it is for</a></li>
        <li><a href="#team">Team</a></li>
        <li><a href="#how-we-work">How it works</a></li>
        <li><a href="#key-facts">Key facts</a></li>
        <li><a href="#faq">FAQ</a></li>
      </ul>
    </section>

    <section class="about-section" id="services" aria-labelledby="services-heading" style="margin-top:56px">
      <div class="section-heading"><div class="section-heading__title">
        <p class="eyebrow">Services</p>
        <h2 id="services-heading">What GameFinder offers</h2>
      </div></div>
      <ul class="about-grid">
        ${cardsHtml(SERVICES, "about-card")}
      </ul>
    </section>

    <section class="about-section" id="differentiators" aria-labelledby="diff-heading">
      <div class="section-heading"><div class="section-heading__title">
        <p class="eyebrow">Differentiators</p>
        <h2 id="diff-heading">What makes it different</h2>
      </div></div>
      <ul class="about-grid">
        ${cardsHtml(DIFFERENTIATORS, "about-card")}
      </ul>
    </section>

    <section class="about-section" id="audience" aria-labelledby="audience-heading">
      <div class="section-heading"><div class="section-heading__title">
        <p class="eyebrow">Target customers</p>
        <h2 id="audience-heading">Who GameFinder is for</h2>
      </div></div>
      <ul class="about-grid">
        ${cardsHtml(AUDIENCES, "about-card")}
      </ul>
    </section>

    <section class="about-section" id="team" aria-labelledby="team-heading">
      <div class="section-heading"><div class="section-heading__title">
        <p class="eyebrow">Team</p>
        <h2 id="team-heading">Who builds it</h2>
      </div></div>
      <div class="about-panel">
        <h3>An independent project</h3>
        <p>GameFinder is built and maintained by an independent developer,, not a game publisher or studio. Results are ordered by IGDB player rating, not by payment.</p>
        <p>The keyword set is an editorial product. Keywords are chosen, grouped and ordered by hand so that each one teaches something about a game. The code is public on <a href="${REPO_URL}">GitHub</a>.</p>
      </div>
    </section>

    <section class="about-section" id="how-we-work" aria-labelledby="work-heading">
      <div class="section-heading"><div class="section-heading__title">
        <p class="eyebrow">How we work</p>
        <h2 id="work-heading">How a search works</h2>
      </div></div>
      <div class="about-panel">
        <ol class="method-list">
            ${processHtml}
        </ol>
        <p class="about-note">Game data and ratings come from IGDB. Rankings can change as ratings and the catalog change.</p>
      </div>
    </section>

    <section class="about-section" id="key-facts" aria-labelledby="facts-heading">
      <div class="section-heading"><div class="section-heading__title">
        <p class="eyebrow">Key facts</p>
        <h2 id="facts-heading">GameFinder at a glance</h2>
      </div></div>
      <div class="facts-wrap">
        <table class="facts-table">
          <caption>Key facts about GameFinder</caption>
          <tbody>
            ${factsRows}
          </tbody>
        </table>
      </div>
    </section>

    <section class="about-section" id="faq" aria-labelledby="faq-heading">
      <div class="section-heading"><div class="section-heading__title">
        <p class="eyebrow">FAQ</p>
        <h2 id="faq-heading">Frequently asked questions</h2>
      </div></div>
      <div class="faq-list">
        ${faqHtml}
      </div>
    </section>

    <section class="cta-panel" aria-labelledby="cta-heading">
      <div>
        <p class="eyebrow">Try it</p>
        <h2 id="cta-heading">Describe the game you want</h2>
        <p>Pick a keyword or two. The best discoveries usually live in the combination.</p>
      </div>
      <a href="${BASE_URL}/" class="cta-button"><span>Open GameFinder</span><span class="cta-button__arrow" aria-hidden="true">→</span></a>
    </section>

    <footer class="site-footer">
      Game data and ratings are sourced from IGDB.<br />
      <a href="${BASE_URL}/">GameFinder</a> searches by the details that matter: mechanics, setting, mood, and style.
    </footer>
  </main>
</body>
</html>`;
}
