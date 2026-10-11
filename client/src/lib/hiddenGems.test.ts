import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pairingKey, pickHiddenGem } from './hiddenGems';

const pair = (a: number, b: number) => ({ a: { id: a, name: `k${a}` }, b: { id: b, name: `k${b}` }, games: 6, families: 3, payoff: { name: 'G', rating: 80 } });

test('pickHiddenGem: avoids recent pairings', () => {
  const pairs = [pair(1, 2), pair(3, 4)];
  const recent = new Set([pairingKey(pairs[0])]);
  for (const r of [0, 0.5, 0.99]) assert.equal(pickHiddenGem(pairs, recent, () => r), pairs[1]);
});

test('pickHiddenGem: repeats once every pairing is recent', () => {
  const pairs = [pair(1, 2)];
  assert.equal(pickHiddenGem(pairs, new Set([pairingKey(pairs[0])]), () => 0), pairs[0]);
});

test('pickHiddenGem: empty pool', () => {
  assert.equal(pickHiddenGem([], new Set()), null);
});
