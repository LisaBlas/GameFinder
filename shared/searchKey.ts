/**
 * The search body shared by POST /api/games/search and /api/games/count, and
 * an order-insensitive identity for it ("A+B" and "B+A" are the same search),
 * used by both the server count cache and the client preview cache.
 */

export interface SearchPayload {
  filters: Record<string, Array<{ id: number | string }>>;
  excludeKeywords?: number[];
  excludeFilters?: Record<string, number[]>;
  requireDeveloper?: boolean;
  requireRating?: boolean;
}

const ids = (items: Array<{ id: number | string }> | number[] | undefined) =>
  (items ?? [])
    .map(i => Number(typeof i === 'object' ? i.id : i))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

const normCategory = (k: string) => k.toLowerCase().replace(/\s+/g, '_');

export function searchKey(req: SearchPayload): string {
  const filters = Object.keys(req.filters)
    .map(k => [normCategory(k), ids(req.filters[k])] as const)
    .filter(([, v]) => v.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  const excludeFilters = Object.keys(req.excludeFilters ?? {})
    .map(k => [normCategory(k), ids(req.excludeFilters![k])] as const)
    .filter(([, v]) => v.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify([filters, ids(req.excludeKeywords), excludeFilters, !!req.requireDeveloper, !!req.requireRating]);
}
