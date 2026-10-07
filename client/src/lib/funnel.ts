/**
 * Funnel instrumentation: exploration → search → affiliate click.
 * Thin wrapper over the GA4 tag in index.html; a no-op when it isn't loaded.
 *
 * Attribution: keywords added from the keyword map are remembered for the
 * session. A search containing any of them is a map-sourced search, and the
 * affiliate clicks that follow carry that attribution.
 */

declare const gtag: ((...args: unknown[]) => void) | undefined;

export function track(event: string, params: Record<string, string | number | boolean | undefined> = {}) {
  try {
    if (typeof gtag !== 'undefined') gtag('event', event, params);
  } catch {
    /* analytics must never break the app */
  }
}

const mapSourced = new Set<number>();
let lastSearch: { search_source: 'map' | 'other'; map_keyword_count: number } = { search_source: 'other', map_keyword_count: 0 };

export const markMapSourced = (keywordId: number) => mapSourced.add(keywordId);

/** Call when a search runs; returns params to attach to the search event. */
export function attributeSearch(keywordIds: number[]) {
  const fromMap = keywordIds.filter(id => mapSourced.has(id)).length;
  lastSearch = { search_source: fromMap > 0 ? 'map' : 'other', map_keyword_count: fromMap };
  return lastSearch;
}

/** Attribution of the most recent search, for downstream events (affiliate clicks). */
export const searchAttribution = () => lastSearch;
