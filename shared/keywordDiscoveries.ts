import type { GraphNeighbor as CooccurrenceNeighbor } from './keywordRelevance';

/**
 * "Discoveries" (docs/MAP_FEATURE.md, Phase 4): pairings that are strongly
 * related yet shared by only a handful of games — hidden-gem searches.
 *
 * Uses the crawl's per-pair game count, so it costs no IGDB calls. That count
 * is crawl-time and ignores the rest of the user's search, so it's a pointer
 * ("a rare pairing"), not a result count.
 */

export interface Discovery {
  id: number;
  name: string;
  /** Games tagged with both keywords at crawl time. */
  games: number;
  strength: number;
}

export interface DiscoveryOptions {
  /** At least this many shared games: pairs of 2–4 games are mostly coincidence. */
  minGames?: number;
  /** At most this many shared games to count as rare. */
  maxGames?: number;
  /** Must be at least this share of the strongest relation in the list. */
  minShare?: number;
  /** Must be at most this share of the list's median pair count: rare *for this keyword*. */
  maxMedianShare?: number;
  limit?: number;
  /** Editorial filter, e.g. "has a home in the curated taxonomy" (keeps out IGDB meta-tags). */
  eligible?: (id: number) => boolean;
}

export function findDiscoveries(
  neighbors: readonly CooccurrenceNeighbor[],
  { minGames = 5, maxGames = 12, minShare = 0.55, maxMedianShare = 0.6, limit = 3, eligible }: DiscoveryOptions = {},
): Discovery[] {
  // NPMI is rarity-aware: it rates a niche keyword living inside a broad one as strong,
  // which Jaccard can't. Until the crawl emits it, fall back to the ranked relevance.
  const strength = (n: CooccurrenceNeighbor) => (n.npmi !== undefined ? (n.npmi + 1) / 2 : n.relevance ?? n.score);
  const max = Math.max(0, ...neighbors.map(strength));
  if (max <= 0) return [];
  // For a niche keyword every pairing is small; only pairings well below its usual size are news.
  const counts = neighbors.map(n => n.count).sort((a, b) => a - b);
  const median = counts[Math.floor(counts.length / 2)] ?? 0;
  return neighbors
    // count 0 means "no crawl data" (e.g. the category fallback), not "no games".
    .filter(n => n.count >= minGames && n.count <= maxGames && n.count <= median * maxMedianShare && strength(n) >= max * minShare)
    .filter(n => !eligible || eligible(n.id))
    .map(n => ({ id: n.id, name: n.name, games: n.count, strength: strength(n) }))
    .sort((a, b) => b.strength - a.strength || a.games - b.games || a.id - b.id)
    .slice(0, limit);
}

/** A rare-but-strong keyword pairing: a Hidden gem candidate (see shared/hiddenGems.ts). */
export interface RarePairing {
  a: { id: number; name: string };
  b: { id: number; name: string };
  /** Games tagged with both keywords at crawl time. */
  games: number;
}

export interface RarePairingOptions extends Omit<DiscoveryOptions, 'eligible' | 'limit'> {
  /** Pairs within one domain (e.g. two sports) are near-synonyms, not surprises. */
  domainOf?: (id: number) => string | undefined;
  /** Caps how often one keyword appears, so one prolific series can't flood the pool. */
  maxPerKeyword?: number;
}

/**
 * Every keyword's discoveries across the whole graph, as unordered pairs.
 * Built on the map's "Rare pairing" rule (findDiscoveries). Both sides must
 * pass `eligible`; strongest pairings claim each keyword's quota first.
 */
export function findRarePairings(
  graph: Readonly<Record<string, readonly CooccurrenceNeighbor[]>>,
  eligible: (id: number) => boolean,
  nameOf: (id: number) => string | undefined,
  { domainOf, maxPerKeyword = Infinity, ...options }: RarePairingOptions = {},
): RarePairing[] {
  const seen = new Set<string>();
  const candidates: Array<RarePairing & { strength: number }> = [];
  for (const [key, neighbors] of Object.entries(graph)) {
    const id = Number(key);
    const name = nameOf(id);
    if (!name || !eligible(id)) continue;
    for (const d of findDiscoveries(neighbors, { ...options, eligible, limit: Infinity })) {
      const pairKey = id < d.id ? `${id}-${d.id}` : `${d.id}-${id}`;
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);
      if (domainOf && domainOf(id) === domainOf(d.id)) continue;
      candidates.push({ a: { id, name }, b: { id: d.id, name: nameOf(d.id) ?? d.name }, games: d.games, strength: d.strength });
    }
  }
  const uses = new Map<number, number>();
  const pairs: RarePairing[] = [];
  for (const c of candidates.sort((x, y) => y.strength - x.strength || x.games - y.games)) {
    if ((uses.get(c.a.id) ?? 0) >= maxPerKeyword || (uses.get(c.b.id) ?? 0) >= maxPerKeyword) continue;
    uses.set(c.a.id, (uses.get(c.a.id) ?? 0) + 1);
    uses.set(c.b.id, (uses.get(c.b.id) ?? 0) + 1);
    pairs.push({ a: c.a, b: c.b, games: c.games });
  }
  return pairs.sort((x, y) => x.a.id - y.a.id || x.b.id - y.b.id);
}
