import type { IGDBService } from './igdbService';
import { searchKey, type SearchPayload } from '../../shared/searchKey';
import { limitIgdb } from './igdbLimiter';

/**
 * "Which keywords still give results with this search?" for the keyword map's
 * Fits-my-search mode. Facets enumerate the search's games once (exact for
 * every keyword, exclusions included); searches too broad to enumerate fall
 * back to exact per-keyword probes for just the keywords on screen.
 */

export interface FacetRequest extends SearchPayload {
  /** Keywords to count exactly if the search is too broad to facet. */
  probe?: number[];
}

export interface FacetResponse {
  /** Every (known) keyword with ≥1 result alongside the search; empty when incomplete. */
  keywords: Record<number, number>;
  /** True when `keywords` covers the whole result set. */
  complete: boolean;
  /** Result count of the search itself when complete. */
  total: number | null;
  /** Exact counts for requested probe ids (incomplete searches only). */
  probed?: Record<number, number>;
}

const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 300;
export const MAX_PROBE = 120;

type Facets = { total: number; complete: boolean; keywords: Record<number, number> };

export function createFacetService(
  igdb: Pick<IGDBService, 'facetKeywords' | 'probeKeywordCounts'>,
  known: () => ReadonlySet<number>,
) {
  const facets = new Map<string, { at: number; value: Facets }>();
  const facetsInflight = new Map<string, Promise<Facets>>();
  const probes = new Map<string, { at: number; counts: Map<number, number> }>();

  const evict = <V>(m: Map<string, V>) => {
    if (m.size >= MAX_ENTRIES) m.delete(m.keys().next().value!);
  };

  function getFacets(req: SearchPayload, key: string): Promise<Facets> {
    const hit = facets.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return Promise.resolve(hit.value);
    const pending = facetsInflight.get(key);
    if (pending) return pending;
    const p = limitIgdb(() =>
      igdb.facetKeywords(req.filters, req.excludeKeywords ?? [], !!req.requireDeveloper, !!req.requireRating, req.excludeFilters ?? {}),
    )
      .then(raw => {
        // Keep only keywords the map can show: the full facet map can hold thousands of IGDB tags.
        const ids = known();
        const keywords: Record<number, number> = {};
        for (const [id, n] of Object.entries(raw.keywords)) if (ids.has(Number(id))) keywords[Number(id)] = n;
        const value = { ...raw, keywords };
        evict(facets);
        facets.set(key, { at: Date.now(), value });
        return value;
      })
      .finally(() => facetsInflight.delete(key));
    facetsInflight.set(key, p);
    return p;
  }

  return async function fit(req: FacetRequest): Promise<FacetResponse> {
    const key = searchKey(req);
    const f = await getFacets(req, key);
    if (f.complete) return { keywords: f.keywords, complete: true, total: f.total };

    const wanted = Array.from(new Set((req.probe ?? []).filter(id => Number.isInteger(id) && id > 0))).slice(0, MAX_PROBE);
    let entry = probes.get(key);
    if (!entry || Date.now() - entry.at > TTL_MS) {
      evict(probes);
      entry = { at: Date.now(), counts: new Map() };
      probes.set(key, entry);
    }
    const missing = wanted.filter(id => !entry!.counts.has(id));
    if (missing.length) {
      const counts = await limitIgdb(() => igdb.probeKeywordCounts(req.filters, missing, !!req.requireDeveloper, !!req.requireRating));
      for (const id of missing) entry.counts.set(id, counts[id] ?? 0);
    }
    const probed: Record<number, number> = {};
    for (const id of wanted) probed[id] = entry.counts.get(id) ?? 0;
    return { keywords: {}, complete: false, total: null, probed };
  };
}
