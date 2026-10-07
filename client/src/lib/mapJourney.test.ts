import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeJourney, encodeJourney, journeyUrl } from './mapJourney';

const CATS = ['Mechanics & Systems', 'Setting & World', 'Aesthetics & Style'] as const;
const subs = (c: string) => (c === 'Mechanics & Systems' ? ['Combat Systems', 'Progression'] : ['Time Periods']);

test('round-trips a journey', () => {
  const j = { category: 'Mechanics & Systems' as const, subcategory: 'Combat Systems', trail: [{ id: 2399, name: 'turn-based' }, { id: 2228, name: 'dungeon crawler' }] };
  const enc = encodeJourney(j, CATS)!;
  assert.equal(enc, '0|Combat Systems|2399:turn-based,2228:dungeon crawler');
  assert.deepEqual(decodeJourney(enc, CATS, subs), j);
});

test('survives a URL round-trip with the search params kept', () => {
  const enc = encodeJourney({ category: 'Setting & World', subcategory: 'Time Periods', trail: [{ id: 8, name: 'Cold War' }] }, CATS)!;
  const url = new URL(journeyUrl(enc, 'https://gamefinder-app.com/?kw=jrpg'));
  assert.equal(url.searchParams.get('kw'), 'jrpg');
  assert.deepEqual(decodeJourney(url.searchParams.get('map'), CATS, subs)?.trail, [{ id: 8, name: 'cold war' }]);
});

test('separator characters in names cannot break the format', () => {
  const enc = encodeJourney({ category: 'Mechanics & Systems', subcategory: null, trail: [{ id: 1, name: 'a|b,c:d' }] }, CATS)!;
  assert.deepEqual(decodeJourney(enc, CATS, subs)?.trail, [{ id: 1, name: 'a b c d' }]);
});

test('rejects malformed or hostile input', () => {
  for (const bad of [null, '', 'x', '9|Combat Systems|', '0|Combat Systems|abc', '0|Combat Systems|1:', '0|a|b|c', '0|Combat Systems|' + '1:x,'.repeat(400)]) {
    assert.equal(decodeJourney(bad, CATS, subs), null, String(bad).slice(0, 30));
  }
});

test('a category on its own is a valid journey (the category map)', () => {
  assert.deepEqual(decodeJourney('2||', CATS, subs), { category: 'Aesthetics & Style', subcategory: null, trail: [] });
});

test('unknown subcategories are dropped, not trusted', () => {
  assert.deepEqual(decodeJourney('0|<script>|5:stealth', CATS, subs), { category: 'Mechanics & Systems', subcategory: null, trail: [{ id: 5, name: 'stealth' }] });
});
