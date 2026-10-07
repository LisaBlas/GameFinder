/**
 * Deterministic layout for the keyword map: radial slots sized to the
 * viewport, angular memory for nodes that were already on screen, then a
 * cheap collision pass on measured pill bounds. Same input → same output;
 * no live force simulation, so the map never jitters and spatial memory holds.
 * Framework-independent (label widths are injected).
 */
import type { GraphNode, MapNode } from './keywordMap';

export type Point = { x: number; y: number };
export type Size = { width: number; height: number };

export interface LayoutOptions {
  viewport: Size;
  widthOf: (node: GraphNode) => number;
  heightOf?: (node: GraphNode) => number;
  /** Positions of the scene currently on screen, keyed by keyword id. */
  previous?: ReadonlyMap<number, Point>;
  /** Vertical position of the centre as a fraction of the height. */
  centerY?: number;
  /** Rotates the inner-ring slots; 45° puts 4 neighbours on the diagonals (portrait phones). */
  slotOffsetDeg?: number;
  /** Horizontal ring radii as fractions of the width (narrow screens need wider rings). */
  ringWidth?: { inner: number; outer: number };
  /** Vertical ring radii as fractions of the room above/below the centre. */
  ringHeight?: { inner: number; outer: number };
  /** Areas pills must stay out of (e.g. an overlaid toolbar), in viewport coordinates. */
  obstacles?: Rect[];
  margin?: number;
}

export const pillHeight = (node: Pick<GraphNode, 'level'>) => (node.level === 0 ? 30 : 22);

const COLLISION_PASSES = 16;
const GAP = { x: 6, y: 4 };
/** How readily each level gives way in a collision; the centre never moves. */
const MOBILITY: Record<GraphNode['level'], number> = { 0: 0, 1: 0.3, 2: 1 };

const rad = (deg: number) => (deg * Math.PI) / 180;
const angleDiff = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};
// Children of top/bottom parents need a wider fan to clear each other horizontally.
const l2SpreadDeg = (deg: number) => 14 + 10 * Math.abs(Math.sin(rad(deg)));

export function layoutKeywordMap(graph: GraphNode[], opts: LayoutOptions): MapNode[] {
  const { width: W, height: H } = opts.viewport;
  const heightOf = opts.heightOf ?? pillHeight;
  const margin = opts.margin ?? 6;
  const C: Point = { x: W / 2, y: H * (opts.centerY ?? 0.5) };
  const vRoom = Math.min(C.y, H - C.y);
  const ringWidth = opts.ringWidth ?? { inner: 0.163, outer: 0.385 };
  const ringHeight = opts.ringHeight ?? { inner: 0.43, outer: 0.84 };
  const R1 = { x: ringWidth.inner * W, y: ringHeight.inner * vRoom };
  const R2 = { x: ringWidth.outer * W, y: ringHeight.outer * vRoom };
  const onRing = (r: Point, deg: number): Point => ({ x: C.x + r.x * Math.cos(rad(deg)), y: C.y + r.y * Math.sin(rad(deg)) });

  const center = graph.find(n => n.level === 0);
  const level1 = graph.filter(n => n.level === 1);

  // Angular memory: measure survivors' old angles from where the new centre used
  // to be, so the keyword you came from stays on the side you came from.
  const prev = opts.previous;
  const anchor = center && prev?.get(center.id);
  const preferredDeg = (id: number): number | undefined => {
    const p = prev?.get(id);
    if (!anchor || !p) return undefined;
    const dx = (p.x - anchor.x) / R1.x;
    const dy = (p.y - anchor.y) / R1.y;
    if (Math.hypot(dx, dy) < 1e-6) return undefined;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const slots = level1.map((_, i) => -90 + (opts.slotOffsetDeg ?? 0) + (360 / level1.length) * i);
  const free = new Set(slots.map((_, i) => i));
  const slotOf = new Map<number, number>();
  for (const n of level1) {
    const want = preferredDeg(n.id);
    if (want === undefined) continue;
    let best = -1;
    free.forEach(i => {
      if (best === -1 || angleDiff(slots[i], want) < angleDiff(slots[best], want)) best = i;
    });
    slotOf.set(n.id, best);
    free.delete(best);
  }
  // Everyone else fills the remaining slots in strength order, starting at the top.
  const remaining = Array.from(free).sort((a, b) => a - b);
  for (const n of level1) if (!slotOf.has(n.id)) slotOf.set(n.id, remaining.shift()!);

  const degOf = new Map<number, number>();
  const placed = new Map<number, Point>();
  if (center) placed.set(center.id, C);
  for (const n of level1) {
    const deg = slots[slotOf.get(n.id)!];
    degOf.set(n.id, deg);
    placed.set(n.id, onRing(R1, deg));
  }
  const childrenOf = new Map<number, GraphNode[]>();
  for (const n of graph) {
    if (n.level !== 2 || n.parentId === undefined) continue;
    childrenOf.set(n.parentId, [...(childrenOf.get(n.parentId) ?? []), n]);
  }
  childrenOf.forEach((kids, parentId) => {
    const deg = degOf.get(parentId) ?? 0;
    kids.forEach((c, j) => {
      const spread = (j - (kids.length - 1) / 2) * 2 * l2SpreadDeg(deg);
      placed.set(c.id, onRing(R2, deg + spread));
    });
  });

  const boxes = graph
    .filter(n => placed.has(n.id))
    .map(n => ({ node: n, ...placed.get(n.id)!, w: opts.widthOf(n), h: heightOf(n), m: MOBILITY[n.level] }));
  // Obstacles are immovable boxes: the collision pass pushes pills out of them.
  const walls = (opts.obstacles ?? []).map(r => ({ x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, m: 0 }));
  resolveCollisions([...boxes, ...walls], { width: W, height: H }, margin);

  return boxes.map(b => ({ ...b.node, x: b.x, y: b.y }));
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  m: number;
}

const clampBox = (b: Box, vp: Size, margin: number) => {
  if (b.m === 0) return;
  b.x = Math.min(Math.max(b.x, b.w / 2 + margin), vp.width - b.w / 2 - margin);
  b.y = Math.min(Math.max(b.y, b.h / 2 + margin), vp.height - b.h / 2 - margin);
};

/** Pushes overlapping pills apart along their axis of least overlap. Mutates `boxes`. */
export function resolveCollisions(boxes: Box[], vp: Size, margin: number, passes = COLLISION_PASSES) {
  boxes.forEach(b => clampBox(b, vp, margin));
  for (let pass = 0; pass < passes; pass++) {
    let moved = false;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const mass = a.m + b.m;
        if (mass === 0) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const ox = (a.w + b.w) / 2 + GAP.x - Math.abs(dx);
        const oy = (a.h + b.h) / 2 + GAP.y - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        if (ox < oy) {
          const s = dx >= 0 ? 1 : -1;
          a.x -= (s * ox * a.m) / mass;
          b.x += (s * ox * b.m) / mass;
        } else {
          const s = dy >= 0 ? 1 : -1;
          a.y -= (s * oy * a.m) / mass;
          b.y += (s * oy * b.m) / mass;
        }
      }
    }
    boxes.forEach(b => clampBox(b, vp, margin));
    if (!moved) break;
  }
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function sceneBounds(nodes: MapNode[], widthOf: (n: MapNode) => number, heightOf = pillHeight): Rect {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const n of nodes) {
    const w = widthOf(n) / 2;
    const h = heightOf(n) / 2;
    x0 = Math.min(x0, n.x - w);
    y0 = Math.min(y0, n.y - h);
    x1 = Math.max(x1, n.x + w);
    y1 = Math.max(y1, n.y + h);
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

export interface CameraFrame {
  focus: Point;
  scale: number;
}

/**
 * Frames the scene: fits it with padding, and zooms in a little on sparse
 * graphs so a handful of keywords doesn't float in empty space.
 */
export function frameScene(bounds: Rect, vp: Size, padding = 16, maxScale = 1.25): CameraFrame {
  if (!Number.isFinite(bounds.width) || bounds.width <= 0) {
    return { focus: { x: vp.width / 2, y: vp.height / 2 }, scale: 1 };
  }
  const fit = Math.min((vp.width - 2 * padding) / bounds.width, (vp.height - 2 * padding) / bounds.height);
  return {
    focus: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
    scale: Math.min(maxScale, fit),
  };
}

export type Direction = 'up' | 'down' | 'left' | 'right';

const DIR: Record<Direction, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

/**
 * Spatial keyboard navigation: the closest node roughly in the pressed
 * direction (within ~63° of it), favouring ones straight ahead.
 */
export function nearestInDirection<T extends Point & { id: number }>(from: T, candidates: T[], dir: Direction): T | null {
  const d = DIR[dir];
  let best: T | null = null;
  let bestScore = Infinity;
  for (const c of candidates) {
    if (c.id === from.id) continue;
    const vx = c.x - from.x;
    const vy = c.y - from.y;
    const along = vx * d.x + vy * d.y;
    const across = Math.abs(vx * d.y - vy * d.x);
    if (along <= 2 || across > along * 2) continue;
    const score = along + across * 1.5;
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}
