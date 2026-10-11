/**
 * What makes a keyword pairing a "hidden gem" (the Wayfinder's Hidden gem
 * bearing). Rarity alone can't tell a gem from a coincidence: six games from
 * one studio tagged "Tribe" + "No Pause" are as rare as six unrelated games
 * that each pair "Gothic" with "Castle". So a candidate pairing (rare and
 * strongly related in the crawl, see findRarePairings) is judged on its games:
 *
 *   hidden   — few games share both keywords;
 *   gem      — at least one of them is well rated;
 *   genuine  — they come from several independent families (not one series'
 *              tagging habit), and no single family dominates;
 *   evocative — at least one keyword says what the game is about or feels
 *              like (setting, aesthetic, culture), not only how it plays.
 *
 * Pure; scripts/build-hidden-gems.mts fetches the games and applies it.
 */

export interface GemGame {
  name: string;
  /** IGDB total_rating (0–100) and its vote count. */
  rating: number | null;
  votes: number;
  /** Franchise and collection ids; collections negated so the two never collide. */
  groups: number[];
  /** Credited developer names. */
  developers: string[];
}

export interface HiddenGem {
  a: { id: number; name: string };
  b: { id: number; name: string };
  /** Main games (no editions/DLC) tagged with both keywords at build time. */
  games: number;
  families: number;
  /** The best-rated game behind the pairing: why it's worth rolling. */
  payoff: { name: string; rating: number };
}

export const HIDDEN_GEM_CRITERIA = {
  maxGames: 15,
  minFamilies: 3,
  /** No family may hold more than this share of the games. */
  maxFamilyShare: 0.5,
  minPayoffRating: 70,
  minPayoffVotes: 5,
} as const;

/** Main taxonomy categories that describe a game's world or feel. */
export const EVOCATIVE_CATEGORIES: ReadonlySet<string> = new Set([
  'Setting & World', 'Aesthetics & Style', 'Cultural Elements', 'Entertainment Franchises',
]);

/** A title's first word, e.g. "touhou" for every "Touhou …" fan game IGDB doesn't link. */
const titleWord = (name: string) => {
  const word = name.toLowerCase().replace(/^(the|a|an)\s+/, '').split(/[\s:'-]+/)[0];
  return word && word.length >= 3 ? word : null;
};

/**
 * Groups games into families: two games are one family if they share a
 * franchise, collection, developer or leading title word. Over-merging only
 * makes the gem test stricter, never looser.
 */
export function gameFamilies(games: readonly GemGame[]): number[] {
  const parent = games.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const owner = new Map<string, number>();
  games.forEach((g, i) => {
    const word = titleWord(g.name);
    const keys = [...g.groups.map(x => `g${x}`), ...g.developers.map(d => `d${d}`), ...(word ? [`t${word}`] : [])];
    for (const key of keys) {
      const other = owner.get(key);
      if (other === undefined) owner.set(key, i);
      else parent[find(i)] = find(other);
    }
  });
  const sizes = new Map<number, number>();
  games.forEach((_, i) => sizes.set(find(i), (sizes.get(find(i)) ?? 0) + 1));
  return Array.from(sizes.values()).sort((x, y) => y - x);
}

export type GemVerdict =
  | { gem: true; families: number; payoff: { name: string; rating: number } }
  | { gem: false; reason: 'too-common' | 'too-few' | 'one-family' | 'no-payoff' | 'not-evocative' };

export function judgePairing(
  games: readonly GemGame[],
  evocative: boolean,
  criteria = HIDDEN_GEM_CRITERIA,
): GemVerdict {
  if (games.length > criteria.maxGames) return { gem: false, reason: 'too-common' };
  const families = gameFamilies(games);
  if (families.length < criteria.minFamilies) return { gem: false, reason: 'too-few' };
  if (families[0] / games.length > criteria.maxFamilyShare) return { gem: false, reason: 'one-family' };
  const payoff = games
    .filter(g => g.rating !== null && g.votes >= criteria.minPayoffVotes && g.rating >= criteria.minPayoffRating)
    .sort((x, y) => (y.rating ?? 0) - (x.rating ?? 0))[0];
  if (!payoff) return { gem: false, reason: 'no-payoff' };
  if (!evocative) return { gem: false, reason: 'not-evocative' };
  return { gem: true, families: families.length, payoff: { name: payoff.name, rating: Math.round(payoff.rating!) } };
}
