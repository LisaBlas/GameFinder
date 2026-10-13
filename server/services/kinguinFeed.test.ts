import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFeed, regionRank, splitLines } from './kinguinFeed';

const item = (o: { steam?: string; region?: string; eur?: string; type?: string; platform?: string; stock?: string; steamType?: string }) => `
<item>
  <title><![CDATA[x]]></title>
  <prices>
    <price_details><currency>AED</currency><price>999.00</price><link><![CDATA[https://k/aed]]></link></price_details>
    <price_details>
      <currency>EUR</currency>
      <country>DE</country>
      <price>${o.eur ?? '10.00'}</price>
      <link><![CDATA[https://k/eur-${o.eur ?? '10.00'}]]></link>
    </price_details>
  </prices>
  <g:availability>${o.stock ?? 'in stock'}</g:availability>
  <g:product_type>${o.type ?? 'GAME'}</g:product_type>
  <g:platform><![CDATA[${o.platform ?? 'Steam'}]]></g:platform>
  <g:steam_id>${o.steam ?? '42'}</g:steam_id>
  <g:steam_type>${o.steamType ?? 'app'}</g:steam_type>
  <g:region><![CDATA[${o.region ?? 'Steam REGION FREE'}]]></g:region>
</item>`;

async function* lines(text: string) { for (const l of text.split('\n')) yield l; }
const run = (...items: string[]) => readFeed(lines(items.join('\n')));

test('keeps the EUR price and link, not the first currency', async () => {
  const m = await run(item({}));
  assert.deepEqual(m.get('42'), { steamId: '42', priceEur: 10, url: 'https://k/eur-10.00' });
});

test('cheapest region-free key wins', async () => {
  const m = await run(item({ eur: '12.00' }), item({ eur: '7.50' }), item({ eur: '9.00' }));
  assert.equal(m.get('42')?.priceEur, 7.5);
});

test('region-free beats a cheaper Europe-only key; Europe beats nothing', async () => {
  const m = await run(item({ region: 'Steam EUROPE', eur: '3.00' }), item({ eur: '8.00' }));
  assert.equal(m.get('42')?.priceEur, 8);
  const only = await run(item({ region: 'Steam  EUROPE - all countries', eur: '3.00' }));
  assert.equal(only.get('42')?.priceEur, 3);
});

test('skips ASIA keys, non-games, non-Steam, bundles, out of stock and non-numeric IDs', async () => {
  const m = await run(
    item({ region: 'Steam ASIA' }),
    item({ type: 'DLC' }),
    item({ platform: 'Other' }),
    item({ steamType: 'bundle' }),
    item({ stock: 'out of stock' }),
    item({ steam: 'abc' }),
  );
  assert.equal(m.size, 0);
});

test('regionRank', () => {
  assert.equal(regionRank('Steam REGION FREE'), 0);
  assert.equal(regionRank('Steam EUROPE'), 1);
  assert.equal(regionRank('Steam ASIA'), null);
  assert.equal(regionRank(undefined), null);
});

test('splitLines rejoins lines cut across chunks', async () => {
  async function* chunks() { yield 'ab\ncd'; yield 'ef\ng'; yield '\nh'; }
  const out: string[] = [];
  for await (const l of splitLines(chunks())) out.push(l);
  assert.deepEqual(out, ['ab', 'cdef', 'g', 'h']);
});
