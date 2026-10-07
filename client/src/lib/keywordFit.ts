import { useEffect, useMemo, useState } from 'react';
import { searchKey, type SearchPayload } from '../../../shared/searchKey';

/**
 * Client side of the keyword map's "Fits my search" mode (POST /api/games/facets):
 * how many results each keyword would give if added to the current search.
 *
 * Complete facets answer for every keyword at once (moving between
 * subcategories is free). Searches too broad to facet answer only for probed
 * ids; anything unprobed is "unknown" and must not be hidden.
 */

interface FitEntry {
  complete: boolean;
  total: number | null;
  keywords: Record<number, number>;
  probed: Map<number, number>;
}

const entries = new Map<string, FitEntry>();
const inflight = new Map<string, Promise<FitEntry>>();
export const MAX_PROBE = 60;

async function fetchFit(payload: SearchPayload, key: string, probe: number[]): Promise<FitEntry> {
  const res = await fetch('/api/games/facets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, probe }),
  });
  if (!res.ok) throw new Error(`facets ${res.status}`);
  const body = (await res.json()) as { complete: boolean; total: number | null; keywords: Record<number, number>; probed?: Record<number, number> };
  const prev = entries.get(key);
  const entry: FitEntry = {
    complete: body.complete,
    total: body.total,
    keywords: body.keywords,
    probed: new Map([
      ...Array.from(prev?.probed ?? new Map<number, number>()),
      ...Object.entries(body.probed ?? {}).map(([k, v]) => [Number(k), v] as [number, number]),
    ]),
  };
  entries.set(key, entry);
  return entry;
}

function ensureFit(payload: SearchPayload, probe: number[]): Promise<FitEntry> {
  const key = searchKey(payload);
  const have = entries.get(key);
  const missing = have && !have.complete ? probe.filter(id => !have.probed.has(id)) : [];
  if (have && (have.complete || missing.length === 0)) return Promise.resolve(have);
  const pending = inflight.get(key);
  if (pending) return pending.then(() => ensureFit(payload, probe));
  const p = fetchFit(payload, key, (have ? missing : probe).slice(0, MAX_PROBE)).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export interface KeywordFit {
  status: 'off' | 'loading' | 'ready' | 'error';
  /** Results if this keyword were added; undefined = unknown (don't hide it). */
  countOf: (id: number) => number | undefined;
  complete: boolean;
  total: number | null;
  /** Counts shown belong to a previous search while the new one loads. */
  stale: boolean;
}

const OFF: KeywordFit = { status: 'off', countOf: () => undefined, complete: false, total: null, stale: false };

const toFit = (e: FitEntry, status: KeywordFit['status'], stale: boolean): KeywordFit => ({
  status,
  complete: e.complete,
  total: e.total,
  stale,
  countOf: id => (e.complete ? e.keywords[id] ?? 0 : e.probed.get(id)),
});

/**
 * Fit for `payload` (null: mode off or nothing searched). Keeps showing the
 * previous search's answer while a new one loads, so the map doesn't flash.
 */
export function useKeywordFit(payload: SearchPayload | null, probe: number[]): KeywordFit {
  const key = payload ? searchKey(payload) : null;
  const probeKey = probe.slice(0, MAX_PROBE).join(',');
  const [state, setState] = useState<{ key: string | null; entry: FitEntry | null; error: boolean }>({ key: null, entry: null, error: false });

  useEffect(() => {
    if (!payload || !key) return;
    let live = true;
    ensureFit(payload, probe.slice(0, MAX_PROBE))
      .then(entry => live && setState({ key, entry, error: false }))
      .catch(() => live && setState(s => ({ ...s, key, error: true })));
    return () => {
      live = false;
    };
  }, [key, probeKey]); // eslint-disable-line react-hooks/exhaustive-deps -- key/probeKey are the inputs' identity

  return useMemo(() => {
    if (!key) return OFF;
    const fresh = entries.get(key);
    if (state.key === key && state.error) return { ...OFF, status: 'error' };
    if (fresh && (fresh.complete || state.key === key)) return toFit(fresh, 'ready', false);
    if (state.entry) return toFit(state.entry, 'loading', true);
    return { ...OFF, status: 'loading' };
  }, [key, state]);
}
