import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findDiscoveries, findRarePairings } from './keywordDiscoveries';

const n = (id: number, count: number, relevance: number) => ({ id, name: `k${id}`, count, score: relevance / 2, relevance });
// Typical pairings for a broad keyword: median shared-game count well above the rare ones.
const common = [n(101, 90, 0.3), n(102, 80, 0.3), n(103, 70, 0.3), n(104, 60, 0.3), n(105, 50, 0.3)];

test('strong + rare pairings qualify; weak or common ones do not', () => {
  const list = [n(1, 400, 1), n(2, 6, 0.8), n(3, 7, 0.2), n(4, 50, 0.9), n(5, 10, 0.6), ...common];
  assert.deepEqual(findDiscoveries(list).map(d => d.id), [2, 5]);
});

test('coincidences (under 5 shared games) and missing data (0) are ignored', () => {
  assert.deepEqual(findDiscoveries([n(1, 4, 1), n(2, 0, 1), n(3, 2, 1), ...common]), []);
});

test('sorted by strength, then rarity; limited', () => {
  const list = [n(1, 8, 0.6), n(2, 6, 0.6), n(3, 9, 0.9), n(4, 5, 0.7), n(5, 90, 1), ...common];
  assert.deepEqual(findDiscoveries(list, { limit: 3 }).map(d => d.id), [3, 4, 2]);
});

test('editorial filter keeps out ineligible keywords', () => {
  const list = [n(2, 6, 0.8), n(5, 10, 0.6), ...common];
  assert.deepEqual(findDiscoveries(list, { eligible: id => id !== 2 }).map(d => d.id), [5]);
});

test('a niche keyword whose pairings are all small has no discoveries', () => {
  assert.deepEqual(findDiscoveries([n(1, 8, 1), n(2, 7, 0.9), n(3, 6, 0.8)]), []);
});

test('NPMI, when present, decides strength (rare-but-tight beats popular)', () => {
  const list = [{ ...n(1, 300, 1), npmi: 0.1 }, { ...n(2, 6, 0.1), npmi: 0.8 }, ...common.map(c => ({ ...c, npmi: 0 }))];
  assert.deepEqual(findDiscoveries(list).map(d => d.id), [2]);
});

test('falls back to Jaccard score when unranked', () => {
  const list = [{ id: 1, name: 'a', count: 6, score: 0.4 }, { id: 2, name: 'b', count: 300, score: 0.5 }, { id: 3, name: 'c', count: 200, score: 0.1 }];
  assert.deepEqual(findDiscoveries(list).map(d => d.id), [1]);
});

test('findRarePairings: dedupes pairs found from both sides and honours eligibility', () => {
  // 1 and 2 are strongly tied through few games, from each side; 3 is common filler.
  const graph = {
    1: [n(2, 6, 0.9), n(3, 40, 0.8), n(4, 30, 0.5), n(5, 25, 0.5)],
    2: [n(1, 6, 0.9), n(3, 40, 0.8), n(4, 30, 0.5), n(5, 25, 0.5)],
    9: [n(2, 6, 0.9), n(3, 40, 0.8), n(4, 30, 0.5), n(5, 25, 0.5)],
  };
  const names = (id: number) => `k${id}`;
  const pairs = findRarePairings(graph, id => id !== 9, names);
  assert.deepEqual(pairs.map(p => [p.a.id, p.b.id, p.games]), [[1, 2, 6]]);
});

test('findRarePairings: skips keywords with no name', () => {
  const graph = { 1: [n(2, 6, 0.9), n(3, 40, 0.8), n(4, 30, 0.5)] };
  assert.deepEqual(findRarePairings(graph, () => true, () => undefined), []);
});

test('findRarePairings: drops same-domain pairs and caps each keyword', () => {
  const filler = [n(30, 40, 0.8), n(31, 30, 0.5), n(32, 25, 0.5)];
  const graph = {
    1: [n(2, 6, 0.95), n(3, 6, 0.9), n(4, 6, 0.85), ...filler],
    2: [n(1, 6, 0.95), ...filler],
    3: [n(1, 6, 0.9), ...filler],
    4: [n(1, 6, 0.85), ...filler],
  };
  const domain = (id: number) => (id === 4 ? 'a' : id === 1 ? 'a' : 'b');
  const pairs = findRarePairings(graph, () => true, id => `k${id}`, { domainOf: domain, maxPerKeyword: 1 });
  // 1–4 share a domain; 1 is capped at one pairing, so its strongest (1–2) wins over 1–3.
  assert.deepEqual(pairs.map(p => [p.a.id, p.b.id]), [[1, 2]]);
});
