import { useFilters } from '../context/FilterContext';
import { buildSearchPayload } from '../lib/searchPayload';
import { useSearchCount, type CountState } from '../lib/searchCount';

/**
 * Preview count for the current selection, before the user searches. Usually
 * instant: the map already counted "search + keyword" while it was hovered.
 * Idle once a search has run for this selection (results show the real total).
 */
export function useSelectionCount(delayMs = 400): CountState {
  const { selectedFilters, requireDeveloper, requireRating, searchFresh } = useFilters();
  const payload = searchFresh ? null : buildSearchPayload(selectedFilters, { requireDeveloper, requireRating });
  return useSearchCount(payload, delayMs);
}
