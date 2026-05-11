/**
 * build-extended-keywords.mjs
 *
 * Builds client/src/assets/extended_keywords_by_category.json from
 * new_keywords_candidates.json, excluding IDs already in top_keywords_by_category.json.
 *
 * Usage: node scripts/build-extended-keywords.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const TOP_PATH = path.join(root, 'client/src/assets/top_keywords_by_category.json');
const CANDIDATES_PATH = path.join(root, 'client/src/assets/new_keywords_candidates.json');
const OUTPUT_PATH = path.join(root, 'client/src/assets/extended_keywords_by_category.json');

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));

const top = readJson(TOP_PATH);
const candidates = readJson(CANDIDATES_PATH);

const topIds = new Set(Object.values(top).flat().map(k => k.id));

const extended = {};
let skipped = 0;

for (const kw of candidates) {
  if (topIds.has(kw.id)) { skipped++; continue; }
  const sub = kw['sub-category'];
  if (!extended[sub]) extended[sub] = [];
  extended[sub].push(kw);
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(extended, null, 2));

const total = Object.values(extended).reduce((n, arr) => n + arr.length, 0);
console.log(`\n✓ ${total} keywords written to ${OUTPUT_PATH}`);
console.log(`  Duplicates removed: ${skipped}`);
console.log('\nBreakdown by subcategory:');
Object.entries(extended)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([s, kws]) => console.log(`  ${s}: ${kws.length}`));
