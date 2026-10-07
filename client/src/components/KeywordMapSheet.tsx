import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, useDragControls } from 'framer-motion';
import { Check } from 'lucide-react';
import KeywordMap, { type MapLocation } from './KeywordMap';
import { SelectedFilters } from './SelectedFilters';
import { currentMapDepth, isMapEntry } from '../hooks/useMapHistory';
import { useFilters } from '../context/FilterContext';
import { useSelectionCount } from '../hooks/useSelectionCount';
import { formatCount } from '../lib/searchCount';

const OPEN_MARKER = 'kmap-open';
const INST = 'mobile';

type SheetEntry = { gamefinder: typeof OPEN_MARKER };
const isOpenEntry = (s: unknown): s is SheetEntry =>
  typeof s === 'object' && s !== null && (s as SheetEntry).gamefinder === OPEN_MARKER;

/**
 * History plumbing for the mobile map sheet. Opening pushes an entry; map
 * steps push their own entries above it. Closing pops all of them at once,
 * and any popstate that lands below the sheet's entry closes it.
 */
export function openMapSheetEntry() {
  const entry: SheetEntry = { gamefinder: OPEN_MARKER };
  window.history.pushState(entry, '');
}

export function closeMapSheet() {
  window.history.go(-(currentMapDepth(INST) + 1));
}

export function useMapSheetPopClose(open: boolean, onClosed: () => void) {
  useEffect(() => {
    if (!open) return;
    const onPop = (e: PopStateEvent) => {
      if (!isOpenEntry(e.state) && !isMapEntry(e.state, INST)) onClosed();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [open, onClosed]);
}

/**
 * Mobile "Map mode": a full-screen sheet with the thumb-sized map variant,
 * the current search pinned at the bottom, and drag-down-to-close on the handle.
 */
export const KeywordMapSheet: React.FC<{ initialLocation?: MapLocation }> = ({ initialLocation }) => {
  const drag = useDragControls();
  const { selectedFilters } = useFilters();
  const count = useSelectionCount();
  // Portalled: ancestors of the keyword panel create stacking contexts that would
  // trap the sheet under the fixed bottom bar.
  return createPortal(
    <motion.div
      className="kmap-sheet lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Keyword map"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      drag="y"
      dragControls={drag}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.7 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 120 || info.velocity.y > 600) closeMapSheet();
      }}
    >
      <div className="kmap-sheet-handle" onPointerDown={e => drag.start(e)} aria-hidden="true">
        <span />
      </div>
      <div className="flex flex-1 min-h-0 flex-col">
        <KeywordMap variant="mobile" initialLocation={initialLocation} onClose={closeMapSheet} />
      </div>
      <div className="kmap-sheet-tray">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            {selectedFilters.length > 0 ? (
              <SelectedFilters variant="lanes" />
            ) : (
              <p className="text-xs text-muted-foreground">Keywords you add show up here.</p>
            )}
          </div>
          <button type="button" className="kmap-action kmap-action--include is-active" onClick={closeMapSheet}>
            <Check className="h-3.5 w-3.5" />
            Done
            {count.status === 'ready' && <span className="opacity-80">· {formatCount(count.count, count.capped)}</span>}
          </button>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
};
