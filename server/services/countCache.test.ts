import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countKey, createCountCache } from './countCache';

test('countKey ignores order and category spelling', () => {
  const a = countKey({ filters: { Keywords: [{ id: 3 }, { id: 1 }], genres: [{ id: '12' }] }, excludeKeywords: [9, 4] });
  const b = countKey({ filters: { genres: [{ id: 12 }], keywords: [{ id: 1 }, { id: 3 }] }, excludeKeywords: [4, 9] });
  assert.equal(a, b);
  assert.notEqual(a, countKey({ filters: { keywords: [{ id: 1 }, { id: 3 }], genres: [{ id: 12 }] }, requireRating: true }));
});

const fake = () => {
  let calls = 0;
  let active = 0;
  let peak = 0;
  return {
    stats: () => ({ calls, peak }),
    countGames: async () => {
      calls++;
      active++;
      peak = Math.max(peak, active);
      await new Promise(r => setTimeout(r, 15));
      active--;
      return { count: 42, capped: false };
    },
  };
};

test('identical concurrent requests share one IGDB call, then hit the cache', async () => {
  const igdb = fake();
  const count = createCountCache(igdb as never);
  const req = { filters: { keywords: [{ id: 1 }] } };
  const [x, y] = await Promise.all([count(req), count({ filters: { Keywords: [{ id: 1 }] } })]);
  assert.deepEqual(x, { count: 42, capped: false });
  assert.deepEqual(y, x);
  await count(req);
  assert.equal(igdb.stats().calls, 1);
});

test('cache misses go to IGDB at most two at a time', async () => {
  const igdb = fake();
  const count = createCountCache(igdb as never);
  await Promise.all([1, 2, 3, 4, 5, 6].map(id => count({ filters: { keywords: [{ id }] } })));
  assert.equal(igdb.stats().calls, 6);
  assert.ok(igdb.stats().peak <= 2, `peak concurrency ${igdb.stats().peak}`);
});
