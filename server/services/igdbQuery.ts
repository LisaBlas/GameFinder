/**
 * Pure helpers shared by counts and facets so they agree on what "the search"
 * is: the IGDB where clause for the includes, and the exclusions IGDB can't
 * express (its `!=` on arrays isn't "doesn't contain"), applied after fetching.
 */

type FilterGroups = Record<string, Array<{ id: number | string }> | undefined>;

export interface QueryFlags {
  requireDeveloper?: boolean;
  requireRating?: boolean;
}

export interface Exclusions {
  excludeKeywords?: number[];
  excludeFilters?: Record<string, number[]>;
  requireDeveloper?: boolean;
}

const FIELD_FOR: Record<string, string> = {
  platforms: 'platforms',
  genres: 'genres',
  themes: 'themes',
  game_mode: 'game_modes',
  keywords: 'keywords',
  perspective: 'player_perspectives',
};

const norm = (category: string) => category.toLowerCase().replace(/\s+/g, '_');

/** IGDB `where` for the includes (all ids in a group must match: IGDB `= [..]` is AND). */
export function buildWhere(filters: FilterGroups, flags: QueryFlags = {}, extraKeywordIds: number[] = []): string {
  const ids = new Map<string, number[]>();
  for (const [category, items] of Object.entries(filters)) {
    const field = FIELD_FOR[norm(category)];
    if (!field || !items?.length) continue;
    const valid = items.map(i => Number(i.id)).filter(n => Number.isFinite(n) && n > 0);
    if (valid.length) ids.set(field, [...(ids.get(field) ?? []), ...valid]);
  }
  if (extraKeywordIds.length) ids.set('keywords', [...(ids.get('keywords') ?? []), ...extraKeywordIds]);
  const conditions = Array.from(ids, ([field, v]) => `${field} = [${Array.from(new Set(v)).join(',')}]`);
  if (flags.requireRating) conditions.push('rating != null');
  if (flags.requireDeveloper) conditions.push('involved_companies.developer = true');
  return conditions.length ? conditions.join(' & ') : 'id != null';
}

/** Fields a game needs for applyExclusions to work. */
export const EXCLUSION_FIELDS =
  'keywords, genres, themes, game_modes, player_perspectives, platforms, involved_companies.developer, involved_companies.company.name';

export const needsExclusionFields = (ex: Exclusions) =>
  Boolean(ex.excludeKeywords?.length || Object.values(ex.excludeFilters ?? {}).some(v => v?.length) || ex.requireDeveloper);

/** Ids of an array field whether IGDB returned bare ids or expanded `{ id }` objects. */
export const idsOf = (value: unknown): number[] =>
  Array.isArray(value) ? value.map(v => (typeof v === 'number' ? v : Number((v as { id?: unknown })?.id))).filter(Number.isFinite) : [];

export function applyExclusions<G extends Record<string, unknown>>(games: G[], ex: Exclusions): G[] {
  let out = games;
  const kw = ex.excludeKeywords ?? [];
  if (kw.length) out = out.filter(g => !idsOf(g.keywords).some(id => kw.includes(id)));
  for (const [category, ids] of Object.entries(ex.excludeFilters ?? {})) {
    const field = FIELD_FOR[norm(category)];
    if (!field || !ids?.length) continue;
    out = out.filter(g => !idsOf(g[field]).some(id => ids.includes(id)));
  }
  if (ex.requireDeveloper) {
    out = out.filter(g =>
      (g.involved_companies as Array<{ developer?: boolean; company?: { name?: string } }> | undefined)?.some(
        ic => ic.developer && ic.company?.name?.trim(),
      ),
    );
  }
  return out;
}

/** How many of `games` carry each keyword: the result count of "this search + that keyword". */
export function keywordFacets(games: Array<Record<string, unknown>>): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const g of games) for (const id of Array.from(new Set(idsOf(g.keywords)))) counts[id] = (counts[id] ?? 0) + 1;
  return counts;
}
