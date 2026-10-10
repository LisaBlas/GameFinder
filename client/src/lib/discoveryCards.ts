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
export function getRarity(count: number): RarityTier | null {
  if (count <= 0)   return null;
  if (count <= 5)   return "unique";
  if (count <= 20)  return "epic";
  if (count <= 50)  return "rare";
  if (count <= 150) return "uncommon";
  return "common";
}
