export interface SeoCacheRow {
  slug: string;
  updatedAt: Date;
  gameCount: number;
}

export const MAX_AGE_MS = 36 * 60 * 60 * 1000; // daily cron + one missed run
export const MAX_MISSING = 5;
export const MAX_EMPTY = 5;

/** Returns human-readable problems; an empty list means the cache is healthy. */
export function evaluateSeoCacheHealth(rows: SeoCacheRow[], expectedKeys: string[], now = new Date()): string[] {
  const problems: string[] = [];
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  const missing = expectedKeys.filter((k) => !bySlug.has(k));
  if (missing.length > MAX_MISSING) {
    problems.push(`${missing.length}/${expectedKeys.length} SEO pages have no cache row (e.g. ${missing.slice(0, 3).join(", ")})`);
  }

  const expected = expectedKeys.map((k) => bySlug.get(k)).filter((r): r is SeoCacheRow => !!r);
  if (expected.length === 0) return [...problems, "seo_page_cache is empty"];

  const empty = expected.filter((r) => r.gameCount === 0);
  if (empty.length > MAX_EMPTY) {
    problems.push(`${empty.length} cache rows hold zero games (e.g. ${empty.slice(0, 3).map((r) => r.slug).join(", ")})`);
  }

  const newest = Math.max(...expected.map((r) => r.updatedAt.getTime()));
  const ageH = (now.getTime() - newest) / 3_600_000;
  if (now.getTime() - newest > MAX_AGE_MS) {
    problems.push(`seo_page_cache is stale: newest row is ${ageH.toFixed(1)}h old (limit ${MAX_AGE_MS / 3_600_000}h)`);
  }
  return problems;
}
