/**
 * Pure choreography for keyword-map transitions. Given the scene that was on
 * screen and the scene about to replace it, decides where each entering node
 * comes from, where each leaving node goes, and when everything moves.
 *
 * Nodes and edges keep stable identities (keyword id; undirected id pair), so
 * surviving entities move instead of being re-created. Framework-independent.
 */
import type { MapNode } from './keywordMap';
import { MAP_HEIGHT, MAP_WIDTH } from './keywordMap';

export type Point = { x: number; y: number };

export type MapDirection = 'initial' | 'forward' | 'back' | 'refresh' | 'jump';

/** What the map was showing, independent of layout. */
export interface MapNavState {
  /** Stable key of the explored path: subcategory + trail ids. */
  path: Array<string | number>;
  round: number;
  /** Refresh rotation direction (a mobile swipe left/right); clockwise by default. */
  spin?: 1 | -1;
}

export interface SceneEdge {
  key: string;
  from: number;
  to: number;
  /** Level of the child end, for styling. */
  level: 1 | 2;
  weight: number;
}

export interface SceneSnapshot {
  nav: MapNavState;
  nodes: ReadonlyMap<number, MapNode>;
  edges: ReadonlyMap<string, SceneEdge>;
}

export interface NodeMotion {
  /** Where an entering node starts; undefined for survivors. */
  from?: Point;
  delay: number;
}

export interface EdgeMotion {
  entering: boolean;
  delay: number;
}

export interface TransitionPlan {
  direction: MapDirection;
  edges: SceneEdge[];
  nodes: ReadonlyMap<number, NodeMotion>;
  edgeMotion: ReadonlyMap<string, EdgeMotion>;
  /** Exit targets for nodes on the old scene that are not on the new one. */
  exits: ReadonlyMap<number, Point>;
}

export const MAP_CENTER: Point = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };

/** Timeline, in seconds. See docs/MAP_FEATURE.md "Choreographed transition". */
export const TIMING = {
  focusMove: 0.06, // the explored node starts gliding to the centre first
  survivorMove: 0.14,
  exitDelay: 0.04,
  exit: 0.46, // long enough that leaving nodes overlap the new branches drawing in
  level1Edge: 0.24,
  level1Stagger: 0.04,
  level2Edge: 0.4,
  level2Stagger: 0.025,
  nodeAfterEdge: 0.06,
  // Shifts the reveal earlier when nothing has to move out of the way first.
  initialOffset: -0.2,
  refreshOffset: -0.12,
  drift: 70, // how far entering/leaving nodes travel off-scene, in map units
  refreshTurnDeg: 28,
} as const;

/** Undirected so an edge survives when its endpoints swap parent/child roles. */
export const edgeKey = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);

const samePrefix = (a: MapNavState['path'], b: MapNavState['path'], n: number) => {
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return false;
  return true;
};

export function inferDirection(prev: MapNavState | null, next: MapNavState): MapDirection {
  if (!prev) return 'initial';
  const p = prev.path;
  const n = next.path;
  if (p.length === n.length && samePrefix(p, n, n.length)) {
    return next.round !== prev.round ? 'refresh' : 'jump';
  }
  if (n.length > p.length && samePrefix(p, n, p.length)) return 'forward';
  if (n.length < p.length && samePrefix(p, n, n.length)) return 'back';
  return 'jump';
}

/**
 * Edges for the new scene. Orientation (from → to) is kept from the previous
 * scene for surviving edges so their endpoints never cross over mid-animation;
 * new edges point parent → child, which is also the direction they draw in.
 */
export function buildSceneEdges(nodes: MapNode[], prevEdges?: ReadonlyMap<string, SceneEdge>): SceneEdge[] {
  const ids = new Set(nodes.map(n => n.id));
  const edges: SceneEdge[] = [];
  for (const n of nodes) {
    if (n.parentId === undefined || !ids.has(n.parentId) || n.level === 0) continue;
    const key = edgeKey(n.parentId, n.id);
    const prev = prevEdges?.get(key);
    edges.push({
      key,
      from: prev ? prev.from : n.parentId,
      to: prev ? prev.to : n.id,
      level: n.level,
      weight: n.weight,
    });
  }
  return edges;
}

export function snapshotScene(nav: MapNavState, nodes: MapNode[], edges: SceneEdge[]): SceneSnapshot {
  return {
    nav,
    nodes: new Map(nodes.map(n => [n.id, n])),
    edges: new Map(edges.map(e => [e.key, e])),
  };
}

const offset = (p: Point, away: Point, dist: number): Point => {
  const dx = p.x - away.x;
  const dy = p.y - away.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return { x: p.x, y: p.y - dist };
  return { x: p.x + (dx / len) * dist, y: p.y + (dy / len) * dist };
};

const rotate = (p: Point, around: Point, deg: number): Point => {
  const r = (deg * Math.PI) / 180;
  const dx = p.x - around.x;
  const dy = p.y - around.y;
  return {
    x: around.x + dx * Math.cos(r) - dy * Math.sin(r),
    y: around.y + dx * Math.sin(r) + dy * Math.cos(r),
  };
};

const at = (n: MapNode): Point => ({ x: n.x, y: n.y });

export function planTransition(prev: SceneSnapshot | null, nav: MapNavState, nodes: MapNode[]): TransitionPlan {
  const direction = inferDirection(prev?.nav ?? null, nav);
  const edges = buildSceneEdges(nodes, prev?.edges);
  const next = new Map(nodes.map(n => [n.id, n]));
  const center = nodes.find(n => n.level === 0);
  const prevCenter = prev ? Array.from(prev.nodes.values()).find(n => n.level === 0) : undefined;
  const C = center ? at(center) : MAP_CENTER;

  // Reveal order follows build order: strongest level-1 first, then level-2 by parent.
  const shift = direction === 'initial' ? TIMING.initialOffset : direction === 'refresh' ? TIMING.refreshOffset : 0;
  let l1 = 0;
  let l2 = 0;
  const edgeDelayFor = new Map<number, number>();
  for (const n of nodes) {
    if (n.level === 1) edgeDelayFor.set(n.id, TIMING.level1Edge + l1++ * TIMING.level1Stagger + shift);
    else if (n.level === 2) edgeDelayFor.set(n.id, TIMING.level2Edge + l2++ * TIMING.level2Stagger + shift);
  }

  const nodeMotion = new Map<number, NodeMotion>();
  for (const n of nodes) {
    if (prev?.nodes.has(n.id)) {
      const isFocus = n.level === 0;
      nodeMotion.set(n.id, { delay: isFocus ? TIMING.focusMove : TIMING.survivorMove });
      continue;
    }
    const parent = n.parentId !== undefined ? next.get(n.parentId) : undefined;
    const delay = n.level === 0 ? 0 : (edgeDelayFor.get(n.id) ?? 0) + TIMING.nodeAfterEdge;
    let from: Point;
    switch (direction) {
      case 'back':
        // Reverse of a forward exit: arrive from outside along the radial.
        from = offset(at(n), C, TIMING.drift);
        break;
      case 'refresh':
        from = rotate(at(n), C, -TIMING.refreshTurnDeg * (nav.spin ?? 1));
        break;
      default:
        // Grow out of the parent (or bloom in place for the centre).
        from = parent ? at(parent) : at(n);
    }
    nodeMotion.set(n.id, { from, delay });
  }

  const exits = new Map<number, Point>();
  if (prev) {
    // Forward: the explored node pushes the old scene away from where it was.
    const focusPrev = center ? prev.nodes.get(center.id) : undefined;
    const pushFrom = focusPrev ? at(focusPrev) : prevCenter ? at(prevCenter) : MAP_CENTER;
    prev.nodes.forEach((old, id) => {
      if (next.has(id)) return;
      let to: Point;
      switch (direction) {
        case 'forward':
          to = offset(at(old), pushFrom, TIMING.drift);
          break;
        case 'back': {
          // Reverse of a forward entry: fold back into the parent's new position.
          const parent =
            (old.parentId !== undefined ? next.get(old.parentId) : undefined) ??
            (prevCenter ? next.get(prevCenter.id) : undefined);
          to = parent ? at(parent) : C;
          break;
        }
        case 'refresh':
          to = rotate(at(old), C, TIMING.refreshTurnDeg * (nav.spin ?? 1));
          break;
        default:
          to = at(old);
      }
      exits.set(id, to);
    });
  }

  const edgeMotion = new Map<string, EdgeMotion>();
  for (const e of edges) {
    const child = next.get(e.to)?.level === e.level ? e.to : e.from;
    const entering = !prev?.edges.has(e.key);
    edgeMotion.set(e.key, {
      entering,
      delay: entering ? (edgeDelayFor.get(child) ?? 0) : TIMING.survivorMove,
    });
  }

  return { direction, edges, nodes: nodeMotion, edgeMotion, exits };
}
