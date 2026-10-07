/**
 * Pure data + layout for the related-keyword map (centre keyword, ring of
 * related keywords, dimmed outer ring of their related keywords).
 * Data comes from keyword_cooccurrence.json (see scripts/build-keyword-cooccurrence.mjs),
 * which is large, so it is imported lazily by the caller.
 */

export interface CooccurrenceNeighbor {
  id: number;
  name: string;
  count: number;
  score: number;
}

export type CooccurrenceData = Record<string, CooccurrenceNeighbor[]>;

export interface MapNode {
  id: number;
  name: string;
  level: 0 | 1 | 2;
  parentId?: number;
  weight: number; // 0..1 relative link strength to its parent
  x: number;
  y: number;
}

export const LEVEL1_COUNT = 6;
export const LEVEL2_PER_PARENT = 2;

export const MAP_WIDTH = 640;
export const MAP_HEIGHT = 460;
const CX = MAP_WIDTH / 2;
const CY = MAP_HEIGHT / 2;
const R1 = { x: 120, y: 100 };
const R2 = { x: 255, y: 190 };
const L2_SPREAD_DEG = 15;

const point = (r: { x: number; y: number }, deg: number) => ({
  x: CX + r.x * Math.cos((deg * Math.PI) / 180),
  y: CY + r.y * Math.sin((deg * Math.PI) / 180),
});

export function buildKeywordMap(centerId: number, centerName: string, data: CooccurrenceData): MapNode[] {
  const used = new Set<number>([centerId]);
  const nodes: MapNode[] = [{ id: centerId, name: centerName, level: 0, weight: 1, x: CX, y: CY }];

  const level1 = (data[centerId] || []).slice(0, LEVEL1_COUNT);
  level1.forEach(n => used.add(n.id));
  const maxScore1 = level1[0]?.score || 1;

  level1.forEach((n, i) => {
    const deg = -90 + (360 / level1.length) * i;
    nodes.push({ id: n.id, name: n.name, level: 1, parentId: centerId, weight: n.score / maxScore1, ...point(R1, deg) });
  });

  level1.forEach((parent, i) => {
    const deg = -90 + (360 / level1.length) * i;
    const children = (data[parent.id] || []).filter(c => !used.has(c.id)).slice(0, LEVEL2_PER_PARENT);
    const maxScore2 = children[0]?.score || 1;
    children.forEach((c, j) => {
      used.add(c.id);
      const offset = (j - (children.length - 1) / 2) * 2 * L2_SPREAD_DEG;
      nodes.push({ id: c.id, name: c.name, level: 2, parentId: parent.id, weight: c.score / maxScore2, ...point(R2, deg + offset) });
    });
  });

  return nodes;
}

export const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());

export const truncateLabel = (s: string, max = 16) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
