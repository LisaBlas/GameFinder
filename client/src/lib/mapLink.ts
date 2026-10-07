import { useSyncExternalStore } from 'react';

/**
 * The two-way explanation loop between results and the keyword map
 * (docs/MAP_FEATURE.md, "Results-panel integration"):
 *   card hovered/selected → its keywords glow on the map (the ones that caused
 *   the match glow strongest); map keyword hovered → cards that have it light up.
 */

export interface CardLink {
  gameId: number;
  /** Every keyword on the game. */
  keywordIds: ReadonlySet<number>;
  /** Keywords from the current search that this game matched. */
  matchedIds: ReadonlySet<number>;
}

interface LinkState {
  /** Hovered card wins over the selected (expanded) card. */
  card: CardLink | null;
  mapKeywordId: number | null;
}

let hoveredCard: CardLink | null = null;
let selectedCard: CardLink | null = null;
let state: LinkState = { card: null, mapKeywordId: null };
const listeners = new Set<() => void>();

const update = (next: Partial<LinkState>) => {
  state = { ...state, ...next };
  listeners.forEach(l => l());
};

export const setHoveredCard = (card: CardLink | null) => {
  hoveredCard = card;
  update({ card: hoveredCard ?? selectedCard });
};

export const setSelectedCard = (card: CardLink | null) => {
  selectedCard = card;
  update({ card: hoveredCard ?? selectedCard });
};

export const setMapKeyword = (id: number | null) => {
  if (state.mapKeywordId !== id) update({ mapKeywordId: id });
};

export const subscribeMapLink = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const getMapLink = () => state;

export const useMapLink = () => useSyncExternalStore(subscribeMapLink, getMapLink);

/** Card link for a search result (uses FilterContext's `_filterMatches`). */
export function cardLinkFor(game: {
  id: number;
  keywords?: Array<{ id: number }>;
  _filterMatches?: { matched: Array<{ id: number | string; category: string }> };
}): CardLink {
  return {
    gameId: game.id,
    keywordIds: new Set((game.keywords ?? []).map(k => k.id)),
    matchedIds: new Set(
      (game._filterMatches?.matched ?? []).filter(f => f.category === 'Keywords').map(f => Number(f.id)),
    ),
  };
}
