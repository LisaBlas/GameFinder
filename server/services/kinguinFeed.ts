// Streaming reader for Kinguin's multicurrency affiliate feed (Google-Shopping
// style RSS, ~2 GB, one tag per line). It is never loaded whole: lines go in,
// and only the best offer per Steam app ID is kept (~30k entries).

export interface KinguinOffer {
  steamId: string;
  priceEur: number;
  url: string;
}

interface RawItem {
  productType?: string;
  platform?: string;
  restricted?: number;
  steamId?: string;
  steamType?: string;
  inStock: boolean;
  eurPrice?: number;
  eurLink?: string;
}

// `g:country_limitations` lists the countries where a key does NOT activate.
// The region label is unreliable (a "Steam OTHER" key can be unrestricted, a
// "REGION FREE" one can exclude 250 countries), so the count decides. A few
// excluded countries (the "RoW" keys omit uninhabited territories and a
// handful of states) still work for nearly every buyer.
export const MAX_RESTRICTED_COUNTRIES = 15;

const FIELD_SETTERS: Array<[string, (item: RawItem, value: string) => void]> = [
  ['g:product_type', (i, v) => { i.productType = v; }],
  ['g:platform', (i, v) => { i.platform = v; }],
  ['g:country_limitations', (i, v) => { i.restricted = v ? v.split(',').length : 0; }],
  ['g:steam_id', (i, v) => { i.steamId = v; }],
  ['g:steam_type', (i, v) => { i.steamType = v; }],
  ['g:availability', (i, v) => { i.inStock = v === 'in stock'; }],
];

const tagValue = (line: string, tag: string): string | null => {
  const open = `<${tag}>`;
  if (!line.startsWith(open)) return null;
  const end = line.indexOf(`</${tag}>`);
  if (end < 0) return null;
  return line.slice(open.length, end).replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
};

// Substrings pin the whole 64 KB stream chunk they were cut from; 30k kept
// offers would hold ~2 GB. Copy anything that outlives the line.
const detach = (s: string): string => Buffer.from(s, 'utf8').toString('utf8');

function toOffer(item: RawItem): KinguinOffer | null {
  if (item.productType !== 'GAME' || item.platform !== 'Steam' || item.steamType !== 'app') return null;
  if (!item.inStock || !item.steamId || !/^\d+$/.test(item.steamId)) return null;
  if (item.eurPrice == null || !(item.eurPrice > 0) || !item.eurLink) return null;
  if ((item.restricted ?? 0) > MAX_RESTRICTED_COUNTRIES) return null;
  return { steamId: detach(item.steamId), priceEur: item.eurPrice, url: detach(item.eurLink) };
}

export async function readFeed(lines: AsyncIterable<string>): Promise<Map<string, KinguinOffer>> {
  const best = new Map<string, KinguinOffer>();
  let item: RawItem | null = null;
  let inPrice = false;
  let currency = '';
  let price: number | undefined;

  for await (const raw of lines) {
    const line = raw.trim();
    if (line === '<item>') {
      item = { inStock: false };
      continue;
    }
    if (!item) continue;
    if (line === '</item>') {
      const cand = toOffer(item);
      if (cand) {
        const cur = best.get(cand.steamId);
        if (!cur || cand.priceEur < cur.priceEur) best.set(cand.steamId, cand);
      }
      item = null;
      continue;
    }
    if (line === '<price_details>') { inPrice = true; currency = ''; price = undefined; continue; }
    if (line === '</price_details>') { inPrice = false; continue; }
    if (inPrice) {
      const c = tagValue(line, 'currency');
      if (c !== null) { currency = c; continue; }
      const p = tagValue(line, 'price');
      if (p !== null) { price = Number(p); continue; }
      const l = tagValue(line, 'link');
      if (l !== null && currency === 'EUR') { item.eurPrice = price; item.eurLink = l; }
      continue;
    }
    for (const [tag, set] of FIELD_SETTERS) {
      const value = tagValue(line, tag);
      if (value !== null) { set(item, value); break; }
    }
  }
  return best;
}

// Line splitter with real backpressure (readline's async iterator queues lines
// without limit and ran a 2 GB feed out of memory).
export async function* splitLines(chunks: AsyncIterable<string>): AsyncGenerator<string> {
  let rest = '';
  for await (const chunk of chunks) {
    const parts = (rest + chunk).split('\n');
    rest = parts.pop() ?? '';
    for (const part of parts) yield part;
  }
  if (rest) yield rest;
}
