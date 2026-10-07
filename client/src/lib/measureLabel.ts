import { PILL_PAD, badgeRoom, nodeLabel, nodeWidth, type LabelNode } from './keywordMap';

let ctx: CanvasRenderingContext2D | null | undefined;
let family = '';
const cache = new Map<string, number>();

/**
 * Real pill width for a map node, measured with the page font on a canvas.
 * Falls back to the character-count estimate where canvas is unavailable.
 */
export function measuredNodeWidth(node: LabelNode): number {
  const label = nodeLabel(node);
  const isCenter = node.level === 0;
  const key = `${isCenter ? 'c' : 'o'}${badgeRoom(node)}|${label}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  if (ctx === undefined) {
    ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
    family = typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : '';
    // Widths measured with a fallback font are wrong once the web font arrives.
    document.fonts?.ready.then(() => cache.clear()).catch(() => {});
  }
  if (!ctx) return nodeWidth(node);
  ctx.font = `${isCenter ? 600 : 400} ${isCenter ? 13 : 12}px ${family || 'sans-serif'}`;
  const text = Math.ceil(ctx.measureText(label).width);
  const width = text + (isCenter ? PILL_PAD.center : PILL_PAD.other) + badgeRoom(node);
  cache.set(key, width);
  return width;
}
