import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeHubness, rankGraph, type KeywordGraphData } from './keywordRelevance';

const n = (id: number, name: string, score: number, count = 10) => ({ id, name, score, count });
const names: Record<number, string> = { 1: 'roguelike', 2: 'permadeath', 3: 'combat', 4: 'deckbuilder', 5: 'pixel art', 6: 'souls-like' };
const nameOf = (id: number) => names[id];
const none = { pin: [], boost: [], block: [] };

// "combat" (3) is a hub: every keyword lists it.
const graph: KeywordGraphData = {
  1: [n(3, 'combat', 0.3), n(2, 'permadeath', 0.28), n(4, 'deckbuilder', 0.2)],
  2: [n(3, 'combat', 0.25), n(1, 'roguelike', 0.28)],
  4: [n(3, 'combat', 0.2), n(1, 'roguelike', 0.2)],
  5: [n(3, 'combat', 0.1), n(4, 'deckbuilder', 0.05)],
  6: [n(3, 'combat', 0.4)],
};

test('hubness: keywords listed everywhere score highest', () => {
  const hub = computeHubness(graph);
  assert.equal(hub.get(3), 1);
  assert.ok(hub.get(2)! < hub.get(3)!);
});

test('novelty demotes a hub that only narrowly wins on raw similarity', () => {
  const ranked = rankGraph(graph, { curated: new Set(), overrides: none, nameOf });
  assert.deepEqual(ranked[1].map(x => x.id), [2, 3, 4]);
  for (const x of ranked[1]) assert.ok(x.relevance! >= 0 && x.relevance! <= 1);
});

test('curated keywords get an editorial lift', () => {
  const plain = rankGraph(graph, { curated: new Set(), overrides: none, nameOf });
  const curated = rankGraph(graph, { curated: new Set([4]), overrides: none, nameOf });
  const rel = (g: KeywordGraphData) => g[1].find(x => x.id === 4)!.relevance!;
  assert.ok(rel(curated) > rel(plain));
});

test('NPMI replaces Jaccard as the association signal when present', () => {
  const g: KeywordGraphData = { 1: [{ ...n(2, 'permadeath', 0.5), npmi: -0.2 }, { ...n(4, 'deckbuilder', 0.1), npmi: 0.6 }] };
  const ranked = rankGraph(g, { curated: new Set(), overrides: none, nameOf });
  assert.equal(ranked[1][0].id, 4);
});

test('overrides: block removes, pin forces first, both by name and symmetric', () => {
  const ranked = rankGraph(graph, {
    curated: new Set(),
    overrides: { pin: [['Deckbuilder', 'Roguelike']], boost: [], block: [['combat', 'ROGUELIKE']] },
    nameOf,
  });
  assert.deepEqual(ranked[1].map(x => x.id), [4, 2]);
  assert.ok(ranked[4].some(x => x.id === 3), 'block only applies to its own pair');
  assert.equal(ranked[4][0].id, 1, 'pin is symmetric');
});

test('deterministic', () => {
  const ctx = { curated: new Set([2]), overrides: none, nameOf };
  assert.deepEqual(rankGraph(graph, ctx), rankGraph(graph, ctx));
});
