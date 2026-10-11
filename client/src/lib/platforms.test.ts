import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isObsoletePlatform, platformLabel, sortPlatforms } from './platforms';

test('platformLabel shortens long IGDB names and passes others through', () => {
  assert.equal(platformLabel('PC (Microsoft Windows)'), 'PC');
  assert.equal(platformLabel('PlayStation 5'), 'PlayStation 5');
});

test('sortPlatforms puts PC and current consoles first, keeps unknowns in order', () => {
  const names = ['Google Stadia', 'Xbox One', 'Amiga', 'PC (Microsoft Windows)', 'Atari ST', 'PlayStation 5'];
  const sorted = sortPlatforms(names.map(name => ({ name }))).map(p => p.name);
  assert.deepEqual(sorted, ['PC (Microsoft Windows)', 'PlayStation 5', 'Xbox One', 'Google Stadia', 'Amiga', 'Atari ST']);
});

test('isObsoletePlatform flags dead services only', () => {
  assert.equal(isObsoletePlatform('Google Stadia'), true);
  assert.equal(isObsoletePlatform('PlayStation 4'), false);
});
