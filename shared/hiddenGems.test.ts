import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameFamilies, judgePairing, type GemGame } from './hiddenGems';

const game = (name: string, extra: Partial<GemGame> = {}): GemGame => ({
  name, rating: null, votes: 0, groups: [], developers: [], ...extra,
});

test('gameFamilies: joins by franchise, developer and leading title word', () => {
  const games = [
    game('Tekken 3', { groups: [7] }),
    game('Tekken 4', { groups: [7] }),
    game('Ratchet & Clank', { developers: ['Insomniac'] }),
    game('Spyro', { developers: ['Insomniac'] }),
    game('Touhou Seirensen'),
    game('The Touhou Fan Game'),
    game('Gothic'),
  ];
  assert.deepEqual(gameFamilies(games), [2, 2, 2, 1]);
});

test('judgePairing: one series is a coincidence, not a gem', () => {
  const games = [1, 2, 3, 4].map(n => game(`Tekken ${n}`, { rating: 84, votes: 500 }));
  assert.deepEqual(judgePairing(games, true), { gem: false, reason: 'too-few' });
});

test('judgePairing: a dominant family fails even with enough families', () => {
  const games = [
    ...[1, 2, 3, 4].map(n => game(`Touhou ${n}`, { rating: 80, votes: 9 })),
    game('Alpha'), game('Beta'),
  ];
  assert.deepEqual(judgePairing(games, true), { gem: false, reason: 'one-family' });
});

test('judgePairing: independent, rated and evocative is a gem', () => {
  const games = [
    game('Resident Evil Village', { rating: 85, votes: 615 }),
    game('Devil May Cry', { rating: 80, votes: 300 }),
    game('Shadowgate'),
  ];
  assert.deepEqual(judgePairing(games, true), { gem: true, families: 3, payoff: { name: 'Resident Evil Village', rating: 85 } });
  assert.deepEqual(judgePairing(games, false), { gem: false, reason: 'not-evocative' });
});

test('judgePairing: needs a well-rated game with enough votes', () => {
  const games = [game('A', { rating: 95, votes: 2 }), game('B', { rating: 60, votes: 50 }), game('C')];
  assert.deepEqual(judgePairing(games, true), { gem: false, reason: 'no-payoff' });
});

test('judgePairing: too many games is not hidden', () => {
  const games = Array.from({ length: 16 }, (_, i) => game(`Game${i}`, { rating: 90, votes: 99 }));
  assert.deepEqual(judgePairing(games, true), { gem: false, reason: 'too-common' });
});
