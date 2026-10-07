/**
 * Rarity-aware ranking of keyword relationships (docs/MAP_FEATURE.md,
 * "Relationship quality"). Raw co-occurrence favours generic hub keywords;
 * this blends a rarity-aware association measure with editorial judgement
 * and a novelty term that penalises hubs.
 *
 *   relevance = Σ wᵢ·signalᵢ / Σ wᵢ   over the signals we actually have
 *
 * Signals without data yet (result quality, engagement) are left out and the
 * remaining weights renormalised, so adding them later is a data change only.
 * Pure and deterministic; runs once on the server over the whole graph.
 */

export interface GraphNeighbor {
  id: number;
  name: string;
  count: number;
  /** Jaccard similarity from the crawl. */
  score: number;
  /** Normalised PMI in [-1, 1]; present once the crawl script emits it. */
  npmi?: number;
  /** Blended 0..1 relevance (pinned editorial pairs rank above 1). Added by rankGraph. */
  relevance?: number;
}

export type KeywordGraphData = Record<string, GraphNeighbor[]>;

/** Name-keyed pairs (case-insensitive) so overrides survive IGDB's duplicate ids. */
export interface EditorialOverrides {
  /** Always shown first for each other, in listed order. */
  pin: ReadonlyArray<readonly [string, string]>;
  /** Strong editorial affinity. */
  boost: ReadonlyArray<readonly [string, string]>;
  /** Never shown as related. */
  block: ReadonlyArray<readonly [string, string]>;
}

export const RELEVANCE_WEIGHTS = {
  association: 0.45, // normalised PMI, or Jaccard until the crawl emits PMI
  editorial: 0.25,
  resultQuality: 0.15, // not collected yet
  novelty: 0.1,
  engagement: 0.05, // not collected yet
} as const;

const AVAILABLE = ['association', 'editorial', 'novelty'] as const;
const WEIGHT_SUM = AVAILABLE.reduce((s, k) => s + RELEVANCE_WEIGHTS[k], 0);

const key = (name: string) => name.trim().toLowerCase();
const pairKey = (a: string, b: string) => [key(a), key(b)].sort().join('\u0000');

/**
 * How generic each keyword is: how many other keywords list it as related,
 * log-scaled to 0..1. Hubs (e.g. "combat") score near 1.
 */
export function computeHubness(graph: KeywordGraphData): Map<number, number> {
  const inDegree = new Map<number, number>();
  for (const list of Object.values(graph)) {
    for (const n of list) inDegree.set(n.id, (inDegree.get(n.id) ?? 0) + 1);
  }
  const max = Math.max(1, ...Array.from(inDegree.values()));
  const hub = new Map<number, number>();
  inDegree.forEach((d, id) => hub.set(id, Math.log1p(d) / Math.log1p(max)));
  return hub;
}

export interface RankContext {
  /** Ids from the curated (top) keyword lists: a mild editorial signal. */
  curated: ReadonlySet<number>;
  overrides: EditorialOverrides;
  /** Names of the list owners, needed to match name-keyed overrides. */
  nameOf: (id: number) => string | undefined;
}

export function rankGraph(graph: KeywordGraphData, ctx: RankContext): KeywordGraphData {
  const hub = computeHubness(graph);
  const pins = new Map<string, number>();
  ctx.overrides.pin.forEach(([a, b], i) => pins.set(pairKey(a, b), i));
  const boosts = new Set(ctx.overrides.boost.map(([a, b]) => pairKey(a, b)));
  const blocks = new Set(ctx.overrides.block.map(([a, b]) => pairKey(a, b)));

  const ranked: KeywordGraphData = {};
  for (const [ownerId, list] of Object.entries(graph)) {
    const ownerName = ctx.nameOf(Number(ownerId)) ?? '';
    const pair = (n: GraphNeighbor) => pairKey(ownerName, n.name);
    const kept = list.filter(n => !blocks.has(pair(n)));

    const assoc = (n: GraphNeighbor) => (n.npmi !== undefined ? (n.npmi + 1) / 2 : n.score);
    const maxAssoc = Math.max(1e-9, ...kept.map(assoc));

    const scored = kept.map(n => {
      const p = pair(n);
      const a = assoc(n) / maxAssoc;
      // Curation amplifies a real relationship but can't invent one; explicit boosts are unconditional.
      const editorial = boosts.has(p) ? 1 : ctx.curated.has(n.id) ? 0.5 * a : 0;
      const novelty = 1 - (hub.get(n.id) ?? 0);
      const blended =
        (RELEVANCE_WEIGHTS.association * a +
          RELEVANCE_WEIGHTS.editorial * editorial +
          RELEVANCE_WEIGHTS.novelty * novelty) /
        WEIGHT_SUM;
      const pin = pins.get(p);
      // Pinned pairs sit above every computed score, in their listed order.
      const relevance = pin !== undefined ? 2 - pin / 1000 : Math.round(blended * 1000) / 1000;
      return { ...n, relevance };
    });
    scored.sort((a, b) => b.relevance - a.relevance || b.count - a.count || a.id - b.id);
    ranked[ownerId] = scored;
  }
  return ranked;
}
