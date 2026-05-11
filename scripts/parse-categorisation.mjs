/**
 * parse-categorisation.mjs  — Step 2: parse AI response into JSON
 *
 * Reads scripts/categorise-response.txt (your AI's output) and
 * scripts/enrich-intermediate.json (game counts), then writes
 * client/src/assets/new_keywords_candidates.json for review.
 *
 * Usage: node scripts/parse-categorisation.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const INTERMEDIATE_PATH = path.join(__dirname, 'enrich-intermediate.json');
const RESPONSE_PATH = path.join(__dirname, 'categorise-response.txt');
const OUTPUT_PATH = path.join(root, 'client', 'src', 'assets', 'new_keywords_candidates.json');

const CATEGORY_MAP = {
  'Time Periods':              'Setting & World',
  'Locations':                 'Setting & World',
  'Environmental Features':    'Setting & World',
  'Historical Events':         'Setting & World',
  'Setting Conditions':        'Setting & World',
  'Cultural Elements':         'Setting & World',
  'Vehicles & Transportation': 'Setting & World',
  'Entertainment Franchises':  'Entertainment Franchises',
  'Sports':                    'Genre-Specific Elements',
  'RPGs':                      'Genre-Specific Elements',
  'Puzzles':                   'Genre-Specific Elements',
  'Shooters':                  'Genre-Specific Elements',
  'Art Styles':                'Aesthetics & Style',
  'Visual Themes':             'Aesthetics & Style',
  'Atmosphere':                'Aesthetics & Style',
  'Narrative Tone':            'Aesthetics & Style',
  'Sound Design':              'Aesthetics & Style',
  'Movement':                  'Mechanics & Systems',
  'Structure':                 'Mechanics & Systems',
  'Combat Systems':            'Mechanics & Systems',
  'Challenges':                'Mechanics & Systems',
  'Progression':               'Mechanics & Systems',
  'Controls':                  'Mechanics & Systems',
  'Simulation':                'Mechanics & Systems',
  'Combat Styles':             'Mechanics & Systems',
  'Strategy':                  'Mechanics & Systems',
  'Economy Value':             'Mechanics & Systems',
  'Internet Culture':          'Internet Culture',
};

function main() {
  if (!fs.existsSync(INTERMEDIATE_PATH)) {
    console.error(`Missing ${INTERMEDIATE_PATH} — run enrich-keywords.mjs first`);
    process.exit(1);
  }
  if (!fs.existsSync(RESPONSE_PATH)) {
    console.error(`Missing ${RESPONSE_PATH} — save your AI response there first`);
    process.exit(1);
  }

  const keywords = JSON.parse(fs.readFileSync(INTERMEDIATE_PATH, 'utf8'));
  const kwById = new Map(keywords.map(k => [k.id, k]));

  const lines = fs.readFileSync(RESPONSE_PATH, 'utf8').trim().split('\n');

  const results = [];
  let skipped = 0;
  let unmatched = 0;
  let unknownSubcat = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split('|');
    if (parts.length < 2) { unmatched++; continue; }

    const rawId = parts[0].trim();
    const subcat = parts[1].trim();

    if (subcat === 'skip') { skipped++; continue; }

    const id = parseInt(rawId);
    if (isNaN(id)) { unmatched++; continue; }

    const kw = kwById.get(id);
    if (!kw) { unmatched++; continue; }

    const category = CATEGORY_MAP[subcat];
    if (!category) {
      console.warn(`  Unknown subcategory "${subcat}" for id ${id} ("${kw.name}") — skipping`);
      unknownSubcat++;
      continue;
    }

    results.push({
      name: kw.name,
      category,
      'sub-category': subcat,
      id: kw.id,
      game_count: kw.game_count,
    });
  }

  // Sort by subcategory, then game_count desc
  results.sort((a, b) =>
    a['sub-category'].localeCompare(b['sub-category']) ||
    b.game_count - a.game_count
  );

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));

  console.log(`\n✓ ${results.length} keywords written to ${OUTPUT_PATH}`);
  console.log(`  Skipped: ${skipped} | Unmatched lines: ${unmatched} | Unknown subcategory: ${unknownSubcat}`);

  // Breakdown
  const bySub = {};
  for (const kw of results) {
    bySub[kw['sub-category']] = (bySub[kw['sub-category']] || 0) + 1;
  }
  console.log('\nBreakdown by subcategory:');
  Object.entries(bySub)
    .sort((a, b) => b[1] - a[1])
    .forEach(([s, n]) => console.log(`  ${s}: ${n}`));
}

main();
