/**
 * Editorial story cards at exceptional graph junctions (docs/MAP_FEATURE.md,
 * Phase 4, optional). When the map is centred on a keyword with a story, the
 * inspector shows it.
 *
 * Keys are keyword names (case-insensitive). Example entry:
 *   'cosmic horror': {
 *     title: 'Why cosmic horror pairs with investigation',
 *     body: 'The genre is about learning too much…',
 *     href: '/best/cosmic-horror-games',
 *   },
 *
 * Intentionally empty: stories are editorial content, not something to
 * auto-generate (see docs/SYSTEM_INVARIANTS.md).
 */

export interface KeywordStory {
  title: string;
  body: string;
  /** Optional internal link, e.g. an SEO /best/… page. */
  href?: string;
}

export const KEYWORD_STORIES: Readonly<Record<string, KeywordStory>> = {};

export const storyFor = (keywordName: string, stories: Readonly<Record<string, KeywordStory>> = KEYWORD_STORIES) =>
  stories[keywordName.trim().toLowerCase()];
