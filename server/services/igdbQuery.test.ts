import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyExclusions, buildWhere, keywordFacets, needsExclusionFields } from './igdbQuery';

test('buildWhere: groups by field, merges extra keyword ids, adds quality flags', () => {
  const where = buildWhere(
    { Keywords: [{ id: 5 }, { id: '7' }], genres: [{ id: 12 }], 'Game Mode': [{ id: 1 }], bogus: [{ id: 3 }] },
    { requireRating: true, requireDeveloper: true },
    [9, 5],
  );
  assert.equal(where, 'keywords = [5,7,9] & genres = [12] & game_modes = [1] & rating != null & involved_companies.developer = true');
  assert.equal(buildWhere({}), 'id != null');
});

test('applyExclusions handles bare ids and expanded objects alike', () => {
  const games = [
    { id: 1, keywords: [1, 2], genres: [{ id: 10 }], involved_companies: [{ developer: true, company: { name: 'Studio' } }] },
    { id: 2, keywords: [{ id: 3 }], genres: [{ id: 11 }], involved_companies: [{ developer: false, company: { name: 'Pub' } }] },
    { id: 3, keywords: [4], platforms: [6] },
  ];
  assert.deepEqual(applyExclusions(games, { excludeKeywords: [2] }).map(g => g.id), [2, 3]);
  assert.deepEqual(applyExclusions(games, { excludeFilters: { genres: [11] } }).map(g => g.id), [1, 3]);
  assert.deepEqual(applyExclusions(games, { excludeFilters: { platforms: [6] } }).map(g => g.id), [1, 2], 'platform excludes apply');
  assert.deepEqual(applyExclusions(games, { requireDeveloper: true }).map(g => g.id), [1]);
});

test('keywordFacets counts each game once per keyword', () => {
  assert.deepEqual(keywordFacets([{ keywords: [1, 2, 2] }, { keywords: [{ id: 2 }] }, {}]), { 1: 1, 2: 2 });
});

test('needsExclusionFields', () => {
  assert.equal(needsExclusionFields({}), false);
  assert.equal(needsExclusionFields({ excludeFilters: { genres: [] } }), false);
  assert.equal(needsExclusionFields({ excludeKeywords: [1] }), true);
});
