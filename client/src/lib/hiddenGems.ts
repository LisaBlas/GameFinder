import type { HiddenGem } from '../../../shared/hiddenGems';

/**
 * The Wayfinder's "Hidden gem" pool (GET /api/hidden-gems): pairings judged
 * by shared/hiddenGems.ts and prebuilt by `npm run gems:build`. Fetched once
 * per session.
 */

let pool: Promise<HiddenGem[]> | null = null;

export function loadHiddenGems(): Promise<HiddenGem[]> {
  if (!pool) {
    pool = fetch('/api/hidden-gems')
      .then(res => {
        if (!res.ok) throw new Error(`hidden gems ${res.status}`);
        return res.json() as Promise<{ pairs: HiddenGem[] }>;
      })
      .then(body => body.pairs)
      .catch(err => {
        pool = null; // let the next draw retry
        throw err;
      });
  }
  return pool;
}

export const pairingKey = (p: HiddenGem) => `${p.a.id}-${p.b.id}`;

/** A random pairing, avoiding recent ones while the pool allows it. */
export function pickHiddenGem(
  pairs: readonly HiddenGem[],
  recent: ReadonlySet<string>,
  random: () => number = Math.random,
): HiddenGem | null {
  if (pairs.length === 0) return null;
  const fresh = pairs.filter(p => !recent.has(pairingKey(p)));
  const from = fresh.length > 0 ? fresh : pairs;
  return from[Math.floor(random() * from.length)];
}
