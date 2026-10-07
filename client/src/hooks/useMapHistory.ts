import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Location state that the browser's Back/Forward buttons can retrace.
 *
 * Each push adds a history entry tagged `{ gamefinder: 'kmap', inst, depth }`
 * and remembers the location for that depth. On popstate, an entry tagged with
 * this instance restores its depth; any other entry means "before this map's
 * first push" and restores depth 0. Other overlays (game card, saved panel)
 * push their own entries on top, so popping them lands back on ours: a no-op.
 *
 * Relies on every `history.replaceState` in the app preserving `history.state`.
 */
export interface MapHistoryEntry {
  gamefinder: 'kmap';
  inst: string;
  depth: number;
}

export const isMapEntry = (state: unknown, inst: string): state is MapHistoryEntry =>
  typeof state === 'object' && state !== null && (state as MapHistoryEntry).gamefinder === 'kmap' && (state as MapHistoryEntry).inst === inst;

/** Depth of the current history entry for an instance (0 when it isn't ours). */
export const currentMapDepth = (inst: string) => (isMapEntry(window.history.state, inst) ? window.history.state.depth : 0);

export function useMapHistory<T>(inst: string, initial: T) {
  const [location, setLocation] = useState<T>(initial);
  const stackRef = useRef<T[]>([initial]);
  const depthRef = useRef(0);

  const navigate = useCallback(
    (next: T, { replace = false }: { replace?: boolean } = {}) => {
      if (replace) {
        // The current entry's marker already points at this depth; only the location changes.
        stackRef.current[depthRef.current] = next;
      } else {
        const depth = depthRef.current + 1;
        stackRef.current = [...stackRef.current.slice(0, depth), next];
        depthRef.current = depth;
        const entry: MapHistoryEntry = { gamefinder: 'kmap', inst, depth };
        window.history.pushState(entry, '');
      }
      setLocation(next);
    },
    [inst],
  );

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const target = isMapEntry(e.state, inst) ? e.state.depth : 0;
      if (target === depthRef.current) return;
      const loc = stackRef.current[target];
      if (loc === undefined) return; // entry from an earlier mount; nothing to restore
      depthRef.current = target;
      setLocation(loc);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [inst]);

  return { location, navigate, depthRef };
}
