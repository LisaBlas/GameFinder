/**
 * Discovery draw ids (the Wayfinder's six bearings) and the rarity tiers that
 * colour results, map keywords and Wayfinder destinations by game count.
 */

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** Identifier for each of the 6 Wayfinder bearings (draw sources). */
export type RevealCard =
  | "popular"
  | "rare-combo"
  | "common-keyword"
  | "user-crafts"
  | "unique-keyword"
  | "unique-combo";

/**
 * Visual rarity tier, derived from how many search results a card returns.
 *
 * States a card moves through:
 *   idle          → card has never been pressed (no rarity)
 *   unidentified  → card pressed, search in progress (no rarity yet)
 *   revealed      → search complete, rarity assigned based on result count
 */
export type RarityTier = "common" | "uncommon" | "rare" | "epic" | "unique";

// ---------------------------------------------------------------------------
// Rarity helper
// ---------------------------------------------------------------------------

/**
 * Map a result count to a RarityTier.
 * Returns null when there are no results (0-result reveal).
 * Thresholds are intentional — adjust here, nowhere else.
 */
export const RARITY_CEILING: Record<Exclude<RarityTier, "common">, number> = {
  unique: 5,
  epic: 20,
  rare: 50,
  uncommon: 150,
};

export function getRarity(count: number): RarityTier | null {
  if (count <= 0) return null;
  if (count <= RARITY_CEILING.unique)   return "unique";
  if (count <= RARITY_CEILING.epic)     return "epic";
  if (count <= RARITY_CEILING.rare)     return "rare";
  if (count <= RARITY_CEILING.uncommon) return "uncommon";
  return "common";
}
