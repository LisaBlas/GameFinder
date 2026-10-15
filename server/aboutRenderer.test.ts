import { test } from "node:test";
import assert from "node:assert/strict";
import { renderAboutPage } from "./aboutRenderer";
import { renderSitemap } from "./seoRenderer";

test("About page has the eight sections, a key-facts table and matching FAQ data", () => {
  const html = renderAboutPage();

  for (const id of ["value", "services", "differentiators", "audience", "team", "how-we-work", "key-facts", "faq"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /<link rel="canonical" href="https:\/\/gamefinder-app\.com\/about" \/>/);
  assert.match(html, /<table class="facts-table">[\s\S]*<caption>[\s\S]*<th scope="row">Game data source<\/th><td>IGDB<\/td>/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.match(html, /"@type":"AboutPage"/);

  const questions = [...html.matchAll(/<summary>(.*?)<\/summary>/g)].length;
  const jsonQuestions = [...html.matchAll(/"@type":"Question"/g)].length;
  assert.ok(questions > 0);
  assert.equal(questions, jsonQuestions);
});

test("About page is in the sitemap", () => {
  assert.match(renderSitemap(), /<loc>https:\/\/gamefinder-app\.com\/about<\/loc>/);
});
