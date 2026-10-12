import { PILL_PAD, badgeRoom, nodeLabel, nodeWidth, type LabelNode } from './keywordMap';

let ctx: CanvasRenderingContext2D | null | undefined;
let family = '';
const cache = new Map<string, number>();

/**
 * Real pill width for a map node, measured in the UI font (--font-ui) on a canvas.
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
    // Pills render in the UI face (kmap-relic.css), not the body font.
    family = typeof document !== 'undefined'
      ? getComputedStyle(document.documentElement).getPropertyValue('--font-ui').trim() || getComputedStyle(document.body).fontFamily
      : '';
    // Widths measured with a fallback font are wrong once the web font arrives.
    document.fonts?.ready.then(() => cache.clear()).catch(() => {});
  }
  if (!ctx) return nodeWidth(node);
  ctx.font = `${isCenter ? 700 : 400} ${isCenter ? 15 : 13}px ${family || 'serif'}`;
  const text = Math.ceil(ctx.measureText(label).width);
  const width = text + (isCenter ? PILL_PAD.center : PILL_PAD.other) + badgeRoom(node);
  cache.set(key, width);
  return width;
}

/** Canvas-measured width of `text` in a CSS `font` shorthand; character estimate as fallback. */
export function measureTextWidth(text: string, font: string, fontPx: number): number {
  if (ctx === undefined) measuredNodeWidth({ name: '', level: 1 }); // initialises the canvas
  if (!ctx) return text.length * fontPx * 0.6;
  ctx.font = font;
  return Math.ceil(ctx.measureText(text).width);
}

/**
 * Word-wraps `text` into at most `maxLines` lines no wider than `maxWidth` px
 * (canvas-measured in `font`, default the UI font; character estimate as
 * fallback); overflow ends in "…".
 */
export function wrapText(text: string, maxWidth: number, fontPx: number, maxLines: number, font?: string): string[] {
  if (ctx === undefined) measuredNodeWidth({ name: '', level: 1 }); // initialises the canvas
  const fits = (s: string) => {
    if (!ctx) return s.length * fontPx * 0.52 <= maxWidth;
    ctx.font = font ?? `400 ${fontPx}px ${family || 'sans-serif'}`;
    return ctx.measureText(s).width <= maxWidth;
  };
  const lines: string[] = [];
  let line = '';
  const words = text.trim().split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i];
    if (fits(next) || !line) {
      line = next;
      continue;
    }
    lines.push(line);
    line = words[i];
    if (lines.length === maxLines - 1) {
      // Last line: take the rest, trimming to fit with an ellipsis.
      let rest = words.slice(i).join(' ');
      if (!fits(rest)) {
        while (rest.length > 1 && !fits(`${rest}…`)) rest = rest.slice(0, -1).trimEnd();
        rest = `${rest}…`;
      }
      lines.push(rest);
      return lines;
    }
  }
  if (line) lines.push(line);
  return lines;
}
