/**
 * Shareable map journeys: a map location (category → subcategory → explored
 * keywords) as a compact `?map=` URL parameter, alongside the search's own
 * `kw` params. Decoding validates everything: the param is user input.
 *
 *   map=0|Combat Systems|2399:turn-based,2228:dungeon crawler
 *        ^category index  ^subcategory  ^trail (id:name)
 */

export interface JourneyKeyword {
  id: number;
  name: string;
}

export interface Journey<C extends string = string> {
  category: C;
  subcategory: string | null;
  trail: JourneyKeyword[];
}

export const JOURNEY_PARAM = 'map';
const MAX_TRAIL = 12;
const MAX_NAME = 60;

export function encodeJourney<C extends string>(j: Journey<C>, categories: readonly C[]): string | null {
  const ci = categories.indexOf(j.category);
  if (ci < 0) return null;
  const trail = j.trail
    .slice(-MAX_TRAIL)
    .map(k => `${k.id}:${k.name.replace(/[|,:]/g, ' ').trim().slice(0, MAX_NAME).toLowerCase()}`)
    .join(',');
  return [ci, j.subcategory ?? '', trail].join('|');
}

/**
 * Parses a journey; null when malformed. `subcategoriesOf` restricts the
 * subcategory to real ones for that category (unknown ones are dropped).
 */
export function decodeJourney<C extends string>(
  raw: string | null | undefined,
  categories: readonly C[],
  subcategoriesOf: (c: C) => readonly string[],
): Journey<C> | null {
  if (!raw || raw.length > 1500) return null;
  const parts = raw.split('|');
  if (parts.length !== 3) return null;
  const [ciRaw, sub, trailRaw] = parts;
  if (!/^\d$/.test(ciRaw)) return null;
  const category = categories[Number(ciRaw)];
  if (!category) return null;
  const subcategory = sub && subcategoriesOf(category).includes(sub) ? sub : null;

  const trail: JourneyKeyword[] = [];
  for (const item of trailRaw ? trailRaw.split(',') : []) {
    const m = /^(\d{1,9}):(.{1,60})$/.exec(item);
    if (!m) return null;
    trail.push({ id: Number(m[1]), name: m[2] });
    if (trail.length > MAX_TRAIL) return null;
  }
  // A category alone is its own map (its subcategories as nodes).
  return { category, subcategory, trail };
}

/** A shareable URL for the current page plus this journey (keeps the search params). */
export function journeyUrl(encoded: string, href = window.location.href): string {
  const url = new URL(href);
  url.searchParams.set(JOURNEY_PARAM, encoded);
  return url.toString();
}
