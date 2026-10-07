/**
 * Pure data for the keyword map (centre node, ring of related keywords,
 * dimmed outer ring of their related keywords). Positions come from
 * keywordMapLayout.ts.
 * Data comes from keyword_cooccurrence.json (see scripts/build-keyword-cooccurrence.mjs),
 * ranked and served in slices by GET /api/keyword-graph (keywordGraphStore.ts).
 */
import { layoutKeywordMap } from './keywordMapLayout';

export interface CooccurrenceNeighbor {
  id: number;
  name: string;
  count: number;
  score: number; // Jaccard
  npmi?: number;
  /** Blended rarity-aware rank from the server (shared/keywordRelevance.ts). */
  relevance?: number;
}

export type CooccurrenceData = Record<string, CooccurrenceNeighbor[]>;

/** A keyword that can sit on the inner ring. `score` drives edge weight when known. */
export interface MapSeed {
  id: number;
  name: string;
  score?: number;
  relevance?: number;
}

/** Link strength for edge weight: server relevance when ranked, else raw similarity. */
const strength = (n: MapSeed) => n.relevance ?? n.score;

/** A keyword's place in the map graph, before layout. */
export interface GraphNode {
  id: number;
  name: string;
  level: 0 | 1 | 2;
  parentId?: number;
  weight: number; // 0..1 relative link strength to its parent
}

export interface MapNode extends GraphNode {
  x: number;
  y: number;
}

export interface GraphShape {
  level1Count: number;
  level2PerParent: number;
}

// Category/subcategory nodes use negative ids (keywordTaxonomy: categoryNodeId/subcategoryNodeId).

export const LEVEL1_COUNT = 6;
export const LEVEL2_PER_PARENT = 2;
export const DESKTOP_SHAPE: GraphShape = { level1Count: LEVEL1_COUNT, level2PerParent: LEVEL2_PER_PARENT };

/** Default viewport; the live map measures its container instead. */
export const MAP_WIDTH = 520;
export const MAP_HEIGHT = 440;

const LABEL_MAX: Record<GraphNode['level'], number> = { 0: 22, 1: 14, 2: 13 };
const CHAR_W = 6.2;
/** Room inside non-centre pills for the add/selected badge. */
export const BADGE_ROOM = 16;
/** Horizontal padding around a pill's label (centre / others, the latter excluding the badge). */
export const PILL_PAD = { center: 24, other: 14 } as const;

/** Label/width input: `id` < 0 marks a category/subcategory node (no add badge, longer labels). */
export type LabelNode = Pick<GraphNode, 'name' | 'level'> & { id?: number };
const isTaxonomy = (node: LabelNode) => node.id !== undefined && node.id < 0;

// Taxonomy names are already cased ("Gameplay and Mechanics"); keyword names come lowercase from IGDB.
export const nodeLabel = (node: LabelNode) =>
  isTaxonomy(node)
    ? truncateLabel(node.name, Math.max(LABEL_MAX[node.level], 24))
    : truncateLabel(titleCase(node.name), LABEL_MAX[node.level]);

/** Room a non-centre pill keeps for its add badge (taxonomy nodes can't be added). */
export const badgeRoom = (node: LabelNode) => (node.level === 0 || isTaxonomy(node) ? 0 : BADGE_ROOM);

/** Estimated pill width; the live map measures real text widths instead (see measureLabel). */
export const nodeWidth = (node: LabelNode) =>
  nodeLabel(node).length * (node.level === 0 ? 7.2 : CHAR_W) + (node.level === 0 ? PILL_PAD.center : PILL_PAD.other) + badgeRoom(node);

/** Identity for dedupe: IGDB has distinct ids for the same keyword name. */
export const nameKey = (name: string) => name.trim().toLowerCase();

/**
 * Makes an equal-weight adjacency list from a curated subcategory. Used only
 * when the IGDB co-occurrence crawl has no row for the current keyword.
 */
export function buildCategoryFallbackData(keywords: MapSeed[]): CooccurrenceData {
  return Object.fromEntries(
    keywords.map(keyword => [
      keyword.id,
      keywords
        .filter(candidate => candidate.id !== keyword.id)
        .map(candidate => ({ id: candidate.id, name: candidate.name, count: 0, score: 1 })),
    ]),
  );
}

/**
 * Picks the map graph. Level 1 is the first `level1Count` pool entries not in
 * `exclude.inner`; level 2 is their strongest neighbours not already on the
 * map or in `exclude.outer`. Both sets hold name keys. Refresh passes every
 * name shown so far as `inner` and the previous map's names as `outer`, so the
 * inner ring never repeats and the outer ring stays full without echoing the
 * last map. Order is strength order (level 1, then level 2 by parent).
 * `exclude.allow`, when given, must accept a keyword for it to appear at all
 * (the map's "Fits my search" mode passes "would still give results").
 */
export function selectKeywordGraph(
  center: { id: number; name: string },
  pool: MapSeed[],
  data: CooccurrenceData,
  exclude: { inner?: ReadonlySet<string>; outer?: ReadonlySet<string>; allow?: (id: number) => boolean } = {},
  shape: GraphShape = DESKTOP_SHAPE,
): GraphNode[] {
  const used = new Set<number>([center.id]);
  const usedNames = new Set<string>([nameKey(center.name)]);
  const isFree = (n: { id: number; name: string }, excluded?: ReadonlySet<string>) =>
    !used.has(n.id) && !usedNames.has(nameKey(n.name)) && !excluded?.has(nameKey(n.name)) && (exclude.allow?.(n.id) ?? true);
  const take = (n: { id: number; name: string }) => {
    used.add(n.id);
    usedNames.add(nameKey(n.name));
  };
  const nodes: GraphNode[] = [{ id: center.id, name: center.name, level: 0, weight: 1 }];

  const level1: MapSeed[] = [];
  for (const n of pool) {
    if (level1.length === shape.level1Count) break;
    if (isFree(n, exclude.inner)) {
      take(n);
      level1.push(n);
    }
  }
  const maxScore1 = Math.max(...level1.map(n => strength(n) ?? 0)) || 1;
  for (const n of level1) {
    const s = strength(n);
    const weight = s !== undefined ? s / maxScore1 : 0.5;
    nodes.push({ id: n.id, name: n.name, level: 1, parentId: center.id, weight });
  }

  for (const parent of level1) {
    const children: CooccurrenceNeighbor[] = [];
    for (const c of data[parent.id] || []) {
      if (children.length === shape.level2PerParent) break;
      if (isFree(c, exclude.outer)) {
        take(c);
        children.push(c);
      }
    }
    const maxScore2 = (children[0] && strength(children[0])) || 1;
    for (const c of children) {
      nodes.push({ id: c.id, name: c.name, level: 2, parentId: parent.id, weight: (strength(c) ?? 0) / maxScore2 });
    }
  }
  return nodes;
}

/** Graph + default layout at the default viewport with estimated label widths. */
export function buildKeywordMap(
  center: { id: number; name: string },
  pool: MapSeed[],
  data: CooccurrenceData,
  exclude: { inner?: ReadonlySet<string>; outer?: ReadonlySet<string> } = {},
  shape: GraphShape = DESKTOP_SHAPE,
): MapNode[] {
  return layoutKeywordMap(selectKeywordGraph(center, pool, data, exclude, shape), {
    viewport: { width: MAP_WIDTH, height: MAP_HEIGHT },
    widthOf: nodeWidth,
  });
}

export const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());

export const truncateLabel = (s: string, max = 16) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
