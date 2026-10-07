import { useSyncExternalStore } from 'react';
import type { CooccurrenceData, CooccurrenceNeighbor } from './keywordMap';

/**
 * Client cache of ranked keyword-map neighbour lists, fetched in slices from
 * GET /api/keyword-graph instead of shipping the whole 1.8 MB graph. Lists are
 * immutable per server version, so once loaded they're kept for the session;
 * the HTTP cache covers repeat visits.
 */

const lists: CooccurrenceData = {};
const inflight = new Map<number, Promise<void>>();
const listeners = new Set<() => void>();
let snapshot: CooccurrenceData = {};
let version: string | null = null;

const emit = () => {
  snapshot = { ...lists };
  listeners.forEach(l => l());
};

export const hasList = (id: number) => id in lists;

/** Ids whose lists are needed to draw `id` as a centre: itself and its neighbours. */
export const centerRequirements = (id: number) => [id, ...(lists[id] ?? []).map(n => n.id)];

async function fetchSlice(ids: number[], depth: 1 | 2) {
  const res = await fetch(`/api/keyword-graph?depth=${depth}&ids=${ids.join(',')}`);
  if (!res.ok) throw new Error(`keyword graph ${res.status}`);
  const body = (await res.json()) as { version: string; lists: Record<string, CooccurrenceNeighbor[]> };
  if (version && body.version !== version) {
    // Redeployed with new data: older lists may disagree, start over.
    for (const k of Object.keys(lists)) delete lists[k as unknown as number];
  }
  version = body.version;
  for (const [k, v] of Object.entries(body.lists)) lists[Number(k)] = v;
  emit();
}

const BATCH = 100; // server cap per request

/**
 * Loads the lists for `ids` (depth 2: plus each one's neighbours). Ids already
 * loaded or loading are skipped; concurrent callers share requests.
 */
export function ensureLists(ids: number[], depth: 1 | 2 = 1): Promise<void> {
  const wanted = ids.filter(id => id > 0);
  const pending = wanted.map(id => inflight.get(id)).filter(Boolean) as Promise<void>[];
  // Depth 2 also needs the neighbours, which we can only know once a list is here.
  const missing = wanted.filter(id => !inflight.has(id) && (!hasList(id) || (depth === 2 && !centerRequirements(id).every(hasList))));
  for (let i = 0; i < missing.length; i += BATCH) {
    const chunk = missing.slice(i, i + BATCH);
    const p = fetchSlice(chunk, depth).finally(() => chunk.forEach(id => inflight.delete(id)));
    chunk.forEach(id => inflight.set(id, p));
    pending.push(p);
  }
  return Promise.all(pending).then(() => undefined);
}

/** Warm the lists for likely next steps when the browser is idle. Fire and forget. */
export function prefetchLists(ids: number[], depth: 1 | 2 = 2) {
  const run = () => void ensureLists(ids, depth).catch(() => {});
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ric) ric(run, { timeout: 2000 });
  else setTimeout(run, 300);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** Everything loaded so far; re-renders when more arrives. */
export const useKeywordGraph = () => useSyncExternalStore(subscribe, () => snapshot);
