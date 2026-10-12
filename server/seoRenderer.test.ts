import { test } from "node:test";
import assert from "node:assert/strict";
import { renderNotFoundPage, renderSeoPage } from "./seoRenderer";
import type { SeoPage } from "./seoPages";

const page: SeoPage = {
  slug: "test-games",
  title: "Best Test Games - A Useful Collection",
  description: "Games selected for a renderer test.",
  intro: "A focused test of the field guide.",
  filters: [
    { category: "Keywords", id: 1, name: "Crafting" },
    { category: "genres", id: 12, name: "Role-playing (RPG)" },
  ],
  relatedSlugs: ["cozy-games"],
  searchLabel: "Find test games",
};

test("SEO field guide renders useful sections and safe game content", () => {
  const html = renderSeoPage(page, [
    {
      id: 42,
      name: "Swords & <Sorcery>",
      rating: 91,
      summary: "A ranked result with a useful summary.",
      cover: "https://images.example/cover.jpg",
    },
  ]);

  assert.match(html, /<h1>Best Test Games - A Useful Collection<\/h1>/);
  assert.match(html, /id="top-picks"/);
  assert.match(html, /Top 1 matches/);
  assert.match(html, /Swords &amp; &lt;Sorcery&gt;/);
  assert.match(html, /Filters used for these matches/);
  assert.doesNotMatch(html, /Why these games fit/);
  assert.match(html, /How this list works/);
  assert.match(html, /href="\/\?kw=crafting&amp;genre=12"/);
  assert.match(html, /data-seo-cta="hero"/);
  assert.match(html, /cta_placement/);
  assert.doesNotMatch(html, /onclick=/);
  assert.equal((html.match(/application\/ld\+json/g) ?? []).length, 2);
});

test("SEO field guide has an actionable fallback without cached games", () => {
  const html = renderSeoPage(page);

  assert.match(html, /Fresh results await/);
  assert.match(html, /Open this search in GameFinder/);
  assert.doesNotMatch(html, /id="top-picks"/);
});

test("SEO not-found page stays in the fantasy visual system", () => {
  const html = renderNotFoundPage();

  assert.match(html, /The path ends here/);
  assert.match(html, /meta name="robots" content="noindex"/);
  assert.match(html, /Back to GameFinder/);
});
