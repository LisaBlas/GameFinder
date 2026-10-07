import type { IGDBService } from './igdbService';
import { searchKey, type SearchPayload } from '../../shared/searchKey';

/**
 * Cached game counts for a search. Map hover previews ask for many counts in
 * quick succession, so: identical searches share one result (TTL cache plus
 * in-flight dedupe), and cache misses go to IGDB at most a few at a time —
 * IGDB allows ~4 requests/second per client and searches need headroom too.
 */

export type CountRequest = SearchPayload;

export interface CountResult {
  count: number;
  capped: boolean;
}

const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 2000;
const MAX_CONCURRENT = 2;

/** Order-insensitive identity of a search, so "A+B" and "B+A" share a cache entry. */
export const countKey = searchKey;

export function createCountCache(igdb: Pick<IGDBService, 'countGames'>) {
  const cache = new Map<string, { at: number; value: CountResult }>();
  const inflight = new Map<string, Promise<CountResult>>();
  let active = 0;
  const queue: Array<() => void> = [];

  async function limited<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= MAX_CONCURRENT) await new Promise<void>(resolve => queue.push(resolve));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  }

  return function getCachedCount(req: CountRequest): Promise<CountResult> {
    const key = countKey(req);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return Promise.resolve(hit.value);
    const pending = inflight.get(key);
    if (pending) return pending;

    const p = limited(() =>
      igdb.countGames(
        req.filters,
        req.excludeKeywords ?? [],
        !!req.requireDeveloper,
        !!req.requireRating,
        req.excludeFilters ?? {},
      ),
    )
      .then(value => {
        if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!); // oldest first
        cache.set(key, { at: Date.now(), value });
        return value;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p;
  };
}
