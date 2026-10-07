import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchPayload, withKeyword } from './searchPayload';
import { craftStrength, formatCount } from './searchCount';
import { searchKey } from '../../../shared/searchKey';

const opts = { requireDeveloper: false, requireRating: true };
const kw = (id: number, mode?: 'include' | 'exclude') => ({ id, name: `k${id}`, category: 'Keywords', mode });

test('groups includes, splits keyword and other excludes, skips parent-only', () => {
  const p = buildSearchPayload(
    [kw(1), kw(2, 'exclude'), { id: 12, name: 'RPG', category: 'genres' }, { id: 5, name: 'PC', category: 'Game Mode', mode: 'exclude' as const }, { id: 99, name: 'parent', category: 'genres', isParentOnly: true }],
    opts,
  )!;
  assert.deepEqual(Object.keys(p.filters).sort(), ['Keywords', 'genres']);
  assert.deepEqual(p.filters.genres.map(f => f.id), [12]);
  assert.deepEqual(p.excludeKeywords, [2]);
  assert.deepEqual(p.excludeFilters, { game_mode: [5] });
  assert.equal(p.requireRating, true);
});

test('nothing included means no search', () => {
  assert.equal(buildSearchPayload([kw(1, 'exclude')], opts), null);
  assert.equal(buildSearchPayload([], opts), null);
});

test('previewing "current + X" has the same identity as the selection after adding X', () => {
  const current = [kw(1), kw(3, 'exclude')];
  const preview = buildSearchPayload(withKeyword(current, kw(7), 'include'), opts)!;
  const afterAdding = buildSearchPayload([kw(7), ...current], opts)!;
  assert.equal(searchKey(preview), searchKey(afterAdding));
});

test('withKeyword flips an existing keyword instead of duplicating it', () => {
  const next = withKeyword([kw(1), kw(2)], kw(2), 'exclude');
  assert.equal(next.filter(f => f.id === 2).length, 1);
  assert.equal(next.find(f => f.id === 2)!.mode, 'exclude');
});

test('craft strength tiers', () => {
  assert.equal(craftStrength(0, false), null);
  assert.equal(craftStrength(3, false), 'hidden gem');
  assert.equal(craftStrength(30, false), 'niche');
  assert.equal(craftStrength(120, false), 'focused');
  assert.equal(craftStrength(250, true), 'broad');
  assert.equal(formatCount(250, true), '250+ games');
  assert.equal(formatCount(1, false), '1 game');
});
