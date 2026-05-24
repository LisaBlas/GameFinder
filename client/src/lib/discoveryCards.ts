/**
 * Discovery card types, rarity helpers, and card metadata.
 * Single source of truth for the 6 homepage discovery cards.
 *
 * Card names (per CLAUDE.md):
 *   Roll section   → Popular | Crafted | Random | User Crafted
 *   Uniques section → Unique Key | Unique Combo
 */

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** Identifier for each of the 6 discovery cards. */
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

// ---------------------------------------------------------------------------
// Card metadata
// ---------------------------------------------------------------------------

/**
 * Human-readable metadata for each discovery card.
 * Use `DISCOVERY_CARD_META[id].name` anywhere a display name is needed.
 */
export const DISCOVERY_CARD_META = {
  /** Cycles a curated sequence of high-use keywords ("Top key this week"). */
  popular:           { name: "Popular",      section: "roll"    },
  /** Curated keyword+filter combos hand-picked by the team. */
  "rare-combo":      { name: "Crafted",      section: "roll"    },
  /** Draws a random single keyword from the full pool. Infinite. */
  "common-keyword":  { name: "Random",       section: "roll"    },
  /** Community-discovered combos. Low result count = niche find. */
  "user-crafts":     { name: "User Crafted", section: "roll"    },
  /** Rare single keywords that tend to surface very few games. */
  "unique-keyword":  { name: "Unique Key",   section: "uniques" },
  /** Rare keyword+filter combos that surface very few games. */
  "unique-combo":    { name: "Unique Combo", section: "uniques" },
} as const satisfies Record<RevealCard, { name: string; section: "roll" | "uniques" }>;
