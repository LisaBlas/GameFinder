import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFacetService } from './facetCache';

const known = () => new Set([1, 2, 3, 4]);

test('complete facets: one enumeration, cached, filtered to known keywords', async () => {
  let calls = 0;
  const fit = createFacetService(
    {
      facetKeywords: async () => {
        calls++;
        return { total: 40, complete: true, keywords: { 1: 40, 2: 7, 999: 3 } };
      },
      probeKeywordCounts: async () => assert.fail('no probes for complete facets'),
    },
    known,
  );
  const req = { filters: { Keywords: [{ id: 1 }] } };
  const [a, b] = await Promise.all([fit(req), fit({ filters: { keywords: [{ id: '1' }] } })]);
  assert.deepEqual(a, { keywords: { 1: 40, 2: 7 }, complete: true, total: 40 });
  assert.deepEqual(b, a);
  await fit({ ...req, probe: [3] });
  assert.equal(calls, 1);
});

test('broad searches probe only missing ids, and remember them', async () => {
  const probed: number[][] = [];
  const fit = createFacetService(
    {
      facetKeywords: async () => ({ total: 2000, complete: false, keywords: { 1: 2000 } }),
      probeKeywordCounts: async (_f, ids) => {
        probed.push(ids);
        return Object.fromEntries(ids.filter(id => id !== 4).map(id => [id, id * 10]));
      },
    },
    known,
  );
  const req = { filters: { genres: [{ id: 31 }] } };
  const r1 = await fit({ ...req, probe: [2, 3, 4] });
  assert.deepEqual(r1, { keywords: {}, complete: false, total: null, probed: { 2: 20, 3: 30, 4: 0 } });
  const r2 = await fit({ ...req, probe: [3, 4, 5] });
  assert.deepEqual(r2.probed, { 3: 30, 4: 0, 5: 50 });
  assert.deepEqual(probed, [[2, 3, 4], [5]]);
});
