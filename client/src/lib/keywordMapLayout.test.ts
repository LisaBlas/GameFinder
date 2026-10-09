import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nodeWidth, selectKeywordGraph, type CooccurrenceData, type GraphNode, type MapNode } from './keywordMap';
import { layoutKeywordMap, nearestInDirection, pillHeight, sceneBounds, type Size } from './keywordMapLayout';

// Long labels on purpose: they are what collides at narrow widths.
const LONG = ['Turn-Based Tactics', 'Roaming Encounters', 'Grid-Based Movement', 'Dungeon Crawler', 'Party-Based', 'Jrpg'];
const kw = (id: number) => ({ id, name: id < 10 ? LONG[id - 2] ?? `keyword ${id}` : `long keyword number ${id}` });
const nb = (id: number, score: number) => ({ ...kw(id), count: score, score });
const data: CooccurrenceData = {};
for (let p = 2; p <= 7; p++) data[p] = [p * 10, p * 10 + 1, p * 10 + 2].map((id, i) => nb(id, 10 - i));
data[1] = [2, 3, 4, 5, 6, 7, 8].map((id, i) => nb(id, 10 - i));

const graph = selectKeywordGraph({ id: 1, name: 'Turn-Based' }, data[1], data);
const opts = (viewport: Size, previous?: Map<number, { x: number; y: number }>) => ({ viewport, widthOf: nodeWidth, previous });

const overlaps = (nodes: MapNode[]) => {
  const hits: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const ox = (nodeWidth(a) + nodeWidth(b)) / 2 - Math.abs(a.x - b.x);
      const oy = (pillHeight(a) + pillHeight(b)) / 2 - Math.abs(a.y - b.y);
      if (ox > 0.5 && oy > 0.5) hits.push(`${a.name} × ${b.name}`);
    }
  }
  return hits;
};

test('deterministic: same input, same positions', () => {
  const vp = { width: 520, height: 440 };
  assert.deepEqual(layoutKeywordMap(graph, opts(vp)), layoutKeywordMap(graph, opts(vp)));
});

for (const vp of [
  { width: 520, height: 440 },
  { width: 460, height: 390 },
  { width: 760, height: 640 },
]) {
  test(`no pill overlaps and everything inside ${vp.width}×${vp.height}`, () => {
    const nodes = layoutKeywordMap(graph, opts(vp));
    assert.equal(nodes.length, graph.length);
    assert.deepEqual(overlaps(nodes), []);
    for (const n of nodes) {
      assert.ok(n.x - nodeWidth(n) / 2 >= 0 && n.x + nodeWidth(n) / 2 <= vp.width, `${n.name} inside horizontally`);
      assert.ok(n.y - pillHeight(n) / 2 >= 0 && n.y + pillHeight(n) / 2 <= vp.height, `${n.name} inside vertically`);
    }
  });
}

test('centre stays at the requested centre point', () => {
  const vp = { width: 390, height: 600 };
  const nodes = layoutKeywordMap(graph, { ...opts(vp), centerY: 0.44 });
  const c = nodes.find(n => n.level === 0)!;
  assert.deepEqual([c.x, c.y], [195, 264]);
});

test('without history, the strongest neighbour takes the top slot', () => {
  const nodes = layoutKeywordMap(graph, opts({ width: 520, height: 440 }));
  const l1 = nodes.filter(n => n.level === 1);
  const top = l1.reduce((a, b) => (b.y < a.y ? b : a));
  assert.equal(top.id, l1[0].id);
});

test('travelling to a node keeps the old centre on the side you came from', () => {
  const vp = { width: 520, height: 440 };
  const before = layoutKeywordMap(graph, opts(vp));
  // Travel to the neighbour on the right-hand side of the map.
  const target = before.filter(n => n.level === 1).reduce((a, b) => (b.x > a.x ? b : a));
  const nextGraph: GraphNode[] = [
    { id: target.id, name: target.name, level: 0, weight: 1 },
    { id: 1, name: 'Turn-Based', level: 1, parentId: target.id, weight: 1 },
    ...[90, 91, 92, 93, 94].map(id => ({ id, name: `k${id}`, level: 1 as const, parentId: target.id, weight: 0.5 })),
  ];
  const prev = new Map(before.map(n => [n.id, { x: n.x, y: n.y }]));
  const after = layoutKeywordMap(nextGraph, opts(vp, prev));
  const c = after.find(n => n.level === 0)!;
  const oldCenter = after.find(n => n.id === 1)!;
  assert.ok(oldCenter.x < c.x, 'old centre ends up to the left, where it was relative to the target');
});

test('sceneBounds includes pill extents', () => {
  const nodes = layoutKeywordMap(graph, opts({ width: 520, height: 440 }));
  const b = sceneBounds(nodes, nodeWidth);
  for (const n of nodes) {
    assert.ok(n.x - nodeWidth(n) / 2 >= b.x - 1e-9 && n.x + nodeWidth(n) / 2 <= b.x + b.width + 1e-9);
  }
});

test('nearestInDirection picks spatial neighbours and ignores things behind', () => {
  const pts = [
    { id: 0, x: 0, y: 0 },
    { id: 1, x: 100, y: 5 },
    { id: 2, x: 40, y: 60 },
    { id: 3, x: -80, y: 0 },
    { id: 4, x: 0, y: -90 },
    { id: 5, x: 30, y: 120 },
  ];
  const from = pts[0];
  assert.equal(nearestInDirection(from, pts, 'right')?.id, 1);
  assert.equal(nearestInDirection(from, pts, 'left')?.id, 3);
  assert.equal(nearestInDirection(from, pts, 'up')?.id, 4);
  assert.equal(nearestInDirection(from, pts, 'down')?.id, 2);
  assert.equal(nearestInDirection(pts[3], [pts[3]], 'left'), null);
});

test('mobile shape fits a phone viewport without overlaps', () => {
  const mobile = selectKeywordGraph({ id: 1, name: 'Turn-Based' }, data[1], data, {}, { level1Count: 4, level2PerParent: 1 });
  const vp = { width: 360, height: 520 };
  const nodes = layoutKeywordMap(mobile, { ...opts(vp), centerY: 0.44, slotOffsetDeg: 45, ringWidth: { inner: 0.27, outer: 0.4 } });
  assert.equal(nodes.filter(n => n.level === 1).length, 4);
  assert.deepEqual(overlaps(nodes), []);
  for (const n of nodes) assert.ok(n.x - nodeWidth(n) / 2 >= 0 && n.x + nodeWidth(n) / 2 <= vp.width);
});

test('selectKeywordGraph: `allow` filters both rings (Fits-my-search mode)', () => {
  const blocked = new Set([3, 20, 21]);
  const g = selectKeywordGraph({ id: 1, name: 'Turn-Based' }, data[1], data, { allow: id => !blocked.has(id) });
  assert.ok(g.every(n => !blocked.has(n.id)));
  assert.equal(g.filter(n => n.level === 1).length, 6, 'the inner ring refills from the remaining pool');
});

test('obstacles: pills are pushed out of an overlaid toolbar', () => {
  const vp = { width: 520, height: 440 };
  const toolbar = { x: 520 - 110, y: 0, width: 110, height: 80 };
  const nodes = layoutKeywordMap(graph, { ...opts(vp), obstacles: [toolbar] });
  for (const n of nodes) {
    const w = nodeWidth(n) / 2;
    const h = pillHeight(n) / 2;
    const inside = n.x + w > toolbar.x + 0.5 && n.x - w < toolbar.x + toolbar.width && n.y - h < toolbar.y + toolbar.height - 0.5;
    assert.ok(!inside, `${n.name} overlaps the toolbar`);
  }
  assert.deepEqual(overlaps(nodes), []);
});
