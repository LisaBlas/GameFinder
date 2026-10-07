import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildKeywordMap, type CooccurrenceData } from './keywordMap';
import {
  MAP_CENTER,
  TIMING,
  buildSceneEdges,
  edgeKey,
  inferDirection,
  planTransition,
  snapshotScene,
  type MapNavState,
} from './keywordMapMotion';

// Small graph: A's neighbours are B..G, B's are A,H,I,...; ids double as names.
const kw = (id: number) => ({ id, name: `k${id}` });
const nb = (id: number, score: number) => ({ ...kw(id), count: score, score });
const data: CooccurrenceData = {
  1: [2, 3, 4, 5, 6, 7, 8, 9].map((id, i) => nb(id, 10 - i)),
  2: [1, 10, 11, 12, 13, 14, 15].map((id, i) => nb(id, 10 - i)),
  3: [1, 16, 17].map((id, i) => nb(id, 10 - i)),
  4: [18, 19].map((id, i) => nb(id, 10 - i)),
  5: [20, 21].map((id, i) => nb(id, 10 - i)),
  6: [22, 23].map((id, i) => nb(id, 10 - i)),
  7: [24, 25].map((id, i) => nb(id, 10 - i)),
  10: [26, 27].map((id, i) => nb(id, 10 - i)),
};
const sceneFor = (centerId: number, nav: MapNavState) => {
  const nodes = buildKeywordMap(kw(centerId), data[centerId] ?? [], data);
  const plan = planTransition(null, nav, nodes);
  return { nodes, snap: snapshotScene(nav, nodes, plan.edges) };
};

test('inferDirection classifies navigation', () => {
  const nav = (path: Array<string | number>, round = 0): MapNavState => ({ path, round });
  assert.equal(inferDirection(null, nav(['s', 1])), 'initial');
  assert.equal(inferDirection(nav(['s', 1]), nav(['s', 1, 2])), 'forward');
  assert.equal(inferDirection(nav(['s']), nav(['s', 1, 2])), 'forward');
  assert.equal(inferDirection(nav(['s', 1, 2]), nav(['s', 1])), 'back');
  assert.equal(inferDirection(nav(['s', 1, 2, 3]), nav(['s', 1])), 'back');
  assert.equal(inferDirection(nav(['s', 1]), nav(['s', 1], 1)), 'refresh');
  assert.equal(inferDirection(nav(['s', 1]), nav(['t', 1])), 'jump');
  assert.equal(inferDirection(nav(['s', 1, 2]), nav(['s', 1, 3])), 'jump');
});

test('edge keys are undirected', () => {
  assert.equal(edgeKey(3, 9), edgeKey(9, 3));
});

test('surviving edges keep orientation; new edges point parent → child', () => {
  const a = sceneFor(1, { path: ['s', 1], round: 0 });
  const bNodes = buildKeywordMap(kw(2), data[2], data);
  const edges = buildSceneEdges(bNodes, a.snap.edges);
  const ab = edges.find(e => e.key === edgeKey(1, 2))!;
  assert.deepEqual([ab.from, ab.to], [1, 2], 'A→B kept even though B is now the parent');
  const fresh = edges.find(e => e.key === edgeKey(2, 10))!;
  assert.deepEqual([fresh.from, fresh.to], [2, 10]);
});

test('initial open blooms every node out of its parent', () => {
  const nodes = buildKeywordMap(kw(1), data[1], data);
  const plan = planTransition(null, { path: ['s', 1], round: 0 }, nodes);
  assert.equal(plan.direction, 'initial');
  assert.equal(plan.exits.size, 0);
  const byId = new Map(nodes.map(n => [n.id, n]));
  for (const n of nodes) {
    const m = plan.nodes.get(n.id)!;
    const parent = n.parentId !== undefined ? byId.get(n.parentId)! : n;
    assert.deepEqual(m.from, { x: parent.x, y: parent.y });
  }
  assert.ok([...plan.edgeMotion.values()].every(e => e.entering));
});

test('forward: explored node survives and glides first; others enter from their parent', () => {
  const a = sceneFor(1, { path: ['s', 1], round: 0 });
  const nav = { path: ['s', 1, 2], round: 0 };
  const nodes = buildKeywordMap(kw(2), data[2], data);
  const plan = planTransition(a.snap, nav, nodes);
  assert.equal(plan.direction, 'forward');

  const focus = plan.nodes.get(2)!;
  assert.equal(focus.from, undefined, 'explored node is a survivor');
  assert.equal(focus.delay, TIMING.focusMove);
  assert.equal(plan.nodes.get(1)!.from, undefined, 'old centre survives as a neighbour');
  assert.equal(plan.nodes.get(1)!.delay, TIMING.survivorMove);

  const entering = nodes.filter(n => plan.nodes.get(n.id)!.from);
  assert.ok(entering.length > 0);
  for (const n of entering) {
    const parent = nodes.find(p => p.id === n.parentId)!;
    assert.deepEqual(plan.nodes.get(n.id)!.from, { x: parent.x, y: parent.y });
    assert.ok(plan.nodes.get(n.id)!.delay > TIMING.survivorMove, 'new nodes arrive after survivors start');
  }

  // Exits are pushed away from where the explored node used to be.
  const bPrev = a.snap.nodes.get(2)!;
  assert.ok(plan.exits.size > 0);
  plan.exits.forEach((to, id) => {
    const old = a.snap.nodes.get(id)!;
    const before = Math.hypot(old.x - bPrev.x, old.y - bPrev.y);
    const after = Math.hypot(to.x - bPrev.x, to.y - bPrev.y);
    assert.ok(after > before, `node ${id} drifts away`);
  });
});

test('reveal order: stronger level-1 edges draw before weaker, level-1 before level-2', () => {
  const nodes = buildKeywordMap(kw(1), data[1], data);
  const plan = planTransition(null, { path: ['s', 1], round: 0 }, nodes);
  const l1 = nodes.filter(n => n.level === 1).map(n => plan.nodes.get(n.id)!.delay);
  const l2 = nodes.filter(n => n.level === 2).map(n => plan.nodes.get(n.id)!.delay);
  assert.deepEqual(l1, [...l1].sort((x, y) => x - y));
  assert.ok(Math.max(...l1) <= Math.min(...l2) + TIMING.level1Stagger * 6);
  assert.ok(Math.min(...l1) < Math.min(...l2));
});

test('back reverses forward: entries come from outside, exits fold into their parent', () => {
  const a = sceneFor(1, { path: ['s', 1], round: 0 });
  const bNodes = buildKeywordMap(kw(2), data[2], data);
  const fwd = planTransition(a.snap, { path: ['s', 1, 2], round: 0 }, bNodes);
  const bSnap = snapshotScene({ path: ['s', 1, 2], round: 0 }, bNodes, fwd.edges);

  const aNodes = buildKeywordMap(kw(1), data[1], data);
  const back = planTransition(bSnap, { path: ['s', 1], round: 0 }, aNodes);
  assert.equal(back.direction, 'back');

  for (const n of aNodes) {
    const m = back.nodes.get(n.id)!;
    if (!m.from) continue;
    const dIn = Math.hypot(m.from.x - MAP_CENTER.x, m.from.y - MAP_CENTER.y);
    const dFinal = Math.hypot(n.x - MAP_CENTER.x, n.y - MAP_CENTER.y);
    assert.ok(dIn > dFinal, `node ${n.id} arrives from outside`);
  }
  // Node 12 was B's child and is not on A's map; B (id 2) is, so 12 folds into B.
  const b = aNodes.find(n => n.id === 2)!;
  assert.deepEqual(back.exits.get(12), { x: b.x, y: b.y });
});

test('refresh rotates the constellation instead of crossfading', () => {
  const nav0 = { path: ['s', 1], round: 0 };
  const a = sceneFor(1, nav0);
  const shown = new Set(a.nodes.filter(n => n.level > 0).map(n => n.name));
  const next = buildKeywordMap(kw(1), data[1], data, { inner: shown, outer: shown });
  const plan = planTransition(a.snap, { path: ['s', 1], round: 1 }, next);
  assert.equal(plan.direction, 'refresh');
  assert.equal(plan.nodes.get(1)!.from, undefined, 'centre stays put');
  plan.exits.forEach((to, id) => {
    const old = a.snap.nodes.get(id)!;
    const rOld = Math.hypot(old.x - MAP_CENTER.x, old.y - MAP_CENTER.y);
    const rNew = Math.hypot(to.x - MAP_CENTER.x, to.y - MAP_CENTER.y);
    assert.ok(Math.abs(rOld - rNew) < 1e-6, 'exit keeps its radius (pure rotation)');
  });
});
