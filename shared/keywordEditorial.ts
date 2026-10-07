import type { EditorialOverrides } from './keywordRelevance';

/**
 * Editorial overrides for the keyword map's related-keyword ranking.
 * GameFinder's edge is curation: the algorithm assists, these decide.
 *
 * Pairs are keyword names (case-insensitive, order-insensitive), e.g.
 *   boost: [['souls-like', 'difficult']],
 *   block: [['horror', 'cute']],
 *   pin:   [['roguelike', 'permadeath']],
 *
 * Intentionally empty: entries are an editorial call, not something to
 * auto-generate (see docs/SYSTEM_INVARIANTS.md).
 */
export const KEYWORD_EDITORIAL: EditorialOverrides = {
  pin: [],
  boost: [],
  block: [],
};
