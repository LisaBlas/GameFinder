import { useEffect, useState } from 'react';
import { searchKey, type SearchPayload } from '../../../shared/searchKey';

/**
 * Result-count previews (POST /api/games/count). Cached per search identity,
 * so the count shown while hovering "current search + X" is already known the
 * moment X is added: the preview for the new selection is instant.
 */

export interface CountResult {
  count: number;
  capped: boolean;
}

const results = new Map<string, CountResult>();
const inflight = new Map<string, Promise<CountResult>>();

export const peekCount = (payload: SearchPayload) => results.get(searchKey(payload));

export function fetchCount(payload: SearchPayload): Promise<CountResult> {
  const key = searchKey(payload);
  const hit = results.get(key);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(key);
  if (pending) return pending;
  const p = fetch('/api/games/count', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(res => {
      if (!res.ok) throw new Error(`count ${res.status}`);
      return res.json() as Promise<CountResult>;
    })
    .then(r => {
      results.set(key, r);
      return r;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export type CountState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; count: number; capped: boolean }
  | { status: 'error' };

/**
 * Count for `payload`, after `delayMs` of it staying the same (hover intent).
 * Cached values show immediately, without the delay.
 */
export function useSearchCount(payload: SearchPayload | null, delayMs = 0): CountState {
  const key = payload ? searchKey(payload) : null;
  const [state, setState] = useState<{ key: string | null; value: CountState }>({ key: null, value: { status: 'idle' } });

  useEffect(() => {
    if (!payload || !key) return;
    const cached = results.get(key);
    if (cached) {
      setState({ key, value: { status: 'ready', ...cached } });
      return;
    }
    let live = true;
    setState({ key, value: { status: 'loading' } });
    const timer = setTimeout(() => {
      fetchCount(payload)
        .then(r => live && setState({ key, value: { status: 'ready', ...r } }))
        .catch(() => live && setState({ key, value: { status: 'error' } }));
    }, delayMs);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps -- `key` is payload's identity

  if (!key) return { status: 'idle' };
  if (state.key !== key) {
    const cached = results.get(key);
    return cached ? { status: 'ready', ...cached } : { status: 'loading' };
  }
  return state.value;
}

/** The doc's "craft strength" of a search, from its result count. */
export type CraftStrength = 'broad' | 'focused' | 'niche' | 'hidden gem';

export function craftStrength(count: number, capped: boolean): CraftStrength | null {
  if (count <= 0) return null;
  if (capped || count > 150) return 'broad';
  if (count > 50) return 'focused';
  if (count > 5) return 'niche';
  return 'hidden gem';
}

export const formatCount = (count: number, capped: boolean) =>
  capped ? `${count}+ games` : count === 1 ? '1 game' : `${count} games`;
