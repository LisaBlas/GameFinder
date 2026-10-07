/**
 * One concurrency budget for background IGDB work (count previews, facets,
 * probes). IGDB allows ~4 requests/second per client; capping these at 2 in
 * flight leaves headroom for the user's actual searches.
 */
const MAX_CONCURRENT = 2;
let active = 0;
const queue: Array<() => void> = [];

export async function limitIgdb<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) await new Promise<void>(resolve => queue.push(resolve));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    queue.shift()?.();
  }
}
