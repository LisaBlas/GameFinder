import type { SearchPayload } from '../../../shared/searchKey';

/** The subset of FilterContext's Filter this needs (kept structural to avoid a context import). */
export interface PayloadFilter {
  id: string | number;
  category: string;
  mode?: 'include' | 'exclude';
  isParentOnly?: boolean;
}

export interface PayloadOptions {
  requireDeveloper: boolean;
  requireRating: boolean;
}

/**
 * Turns the selected filters into the search/count request body: includes
 * grouped by category, keyword excludes and other excludes split out (IGDB
 * can't exclude from array fields, the server post-filters). Returns null
 * when nothing is included — there is no search to run.
 */
export function buildSearchPayload<F extends PayloadFilter>(
  selected: F[],
  opts: PayloadOptions,
): (SearchPayload & { filters: Record<string, F[]> }) | null {
  const filters: Record<string, F[]> = {};
  for (const f of selected) {
    if (f.mode === 'exclude' || f.isParentOnly) continue;
    (filters[f.category] ??= []).push(f);
  }
  if (Object.keys(filters).length === 0) return null;

  const excludeKeywords = selected.filter(f => f.category === 'Keywords' && f.mode === 'exclude').map(f => Number(f.id));
  const excludeFilters: Record<string, number[]> = {};
  for (const f of selected) {
    if (f.mode !== 'exclude' || f.category === 'Keywords') continue;
    (excludeFilters[f.category.toLowerCase().replace(/\s+/g, '_')] ??= []).push(Number(f.id));
  }
  return { filters, excludeKeywords, excludeFilters, requireDeveloper: opts.requireDeveloper, requireRating: opts.requireRating };
}

/** The selection with one keyword set to `mode` (replacing any existing mode for it). */
export function withKeyword<F extends PayloadFilter>(selected: F[], kw: F, mode: 'include' | 'exclude'): F[] {
  return [...selected.filter(f => !(f.category === 'Keywords' && Number(f.id) === Number(kw.id))), { ...kw, mode }];
}
