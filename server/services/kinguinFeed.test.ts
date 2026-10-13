import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFeed, splitLines } from './kinguinFeed';

const item = (o: { steam?: string; limits?: string; eur?: string; type?: string; platform?: string; stock?: string; steamType?: string }) => `
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
  <g:country_limitations>${o.limits ?? ''}</g:country_limitations>
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

test('ignores the region label; a few excluded countries are fine', async () => {
  const m = await run(item({ limits: 'SA,AQ,BV,TF,HM,GS,XK', eur: '14.41' }), item({ eur: '40.00' }));
  assert.equal(m.get('42')?.priceEur, 14.41);
});

test('skips keys restricted to a region (many excluded countries)', async () => {
  const many = Array.from({ length: 200 }, (_, i) => `C${i}`).join(',');
  const m = await run(item({ limits: many, eur: '3.00' }));
  assert.equal(m.size, 0);
  const ok = await run(item({ limits: many, eur: '3.00' }), item({ eur: '9.00' }));
  assert.equal(ok.get('42')?.priceEur, 9);
});

test('skips non-games, non-Steam, bundles, out of stock and non-numeric IDs', async () => {
  const m = await run(
    item({ type: 'DLC' }),
    item({ type: 'ALTERGIFT' }),
    item({ platform: 'Other' }),
    item({ steamType: 'bundle' }),
    item({ stock: 'out of stock' }),
    item({ steam: 'abc' }),
  );
  assert.equal(m.size, 0);
});

test('splitLines rejoins lines cut across chunks', async () => {
  async function* chunks() { yield 'ab\ncd'; yield 'ef\ng'; yield '\nh'; }
  const out: string[] = [];
  for await (const l of splitLines(chunks())) out.push(l);
  assert.deepEqual(out, ['ab', 'cdef', 'g', 'h']);
});
