import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateSeoCacheHealth, type SeoCacheRow } from "./seoCacheHealth";

const now = new Date("2026-10-14T00:00:00Z");
const keys = Array.from({ length: 20 }, (_, i) => `p${i}`);
const rows = (ageH: number, count = 10, n = 20): SeoCacheRow[] =>
  keys.slice(0, n).map((slug) => ({ slug, updatedAt: new Date(now.getTime() - ageH * 3_600_000), gameCount: count }));

test("fresh, complete cache is healthy", () => {
  assert.deepEqual(evaluateSeoCacheHealth(rows(3), keys, now), []);
});
test("flags a cache older than 36h", () => {
  const p = evaluateSeoCacheHealth(rows(40), keys, now);
  assert.equal(p.length, 1);
  assert.match(p[0], /stale/);
});
test("tolerates a few missing rows but flags many", () => {
  assert.deepEqual(evaluateSeoCacheHealth(rows(3, 10, 16), keys, now), []);
  assert.match(evaluateSeoCacheHealth(rows(3, 10, 10), keys, now)[0], /no cache row/);
});
test("flags many zero-game rows", () => {
  assert.match(evaluateSeoCacheHealth(rows(3, 0), keys, now)[0], /zero games/);
});
test("an empty table is reported", () => {
  assert.ok(evaluateSeoCacheHealth([], keys, now).includes("seo_page_cache is empty"));
});
