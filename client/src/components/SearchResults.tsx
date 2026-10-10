import React, { useState, useEffect, useRef } from 'react';
import { useFilters, Filter } from '../context/FilterContext';
import GameCard from './GameCard';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import LoadMoreButton from './LoadMoreButton';
import FilterBar from './FilterBar';
import MobileFilterSheet from './MobileFilterSheet';
import SocketRack, { RACK_SIZE, socketFloorStyle } from './SocketRack';
import { motion, AnimatePresence } from 'framer-motion';
import { cardLinkFor, setHoveredCard, setSelectedCard, subscribeMapLink, getMapLink } from '../lib/mapLink';
import { getRarity, type RarityTier } from '../lib/discoveryCards';
import { ChevronLeft, Share2, Check } from 'lucide-react';
import { SavedGamesControl } from './Navbar';

const RARITY_RGB: Record<RarityTier, string> = {
  common:   '--c-border-rgb',
  uncommon: '--c-emerald-rgb',
  rare:     '--c-rare-blue-rgb',
  epic:     '--c-purple-rgb',
  unique:   '--c-unique-rgb',
};

const RARITY_TEXT: Record<RarityTier, string> = {
  common:   '--c-muted',
  uncommon: '--c-emerald-soft',
  rare:     '--c-rare-blue-soft',
  epic:     '--c-purple-soft',
  unique:   '--c-unique-soft',
};

// How long the previous batch takes to fade out of its sockets when a new
// search starts; matches card-leave in results-relic.css.
const CARD_LEAVE_MS = 280;

const CARD_LAYOUT_TRANSITION = {
  layout: {
    duration: 0.32,
    ease: [0.22, 1, 0.36, 1] as const,
  },
};

interface SearchResultsProps {
  /** Mobile: return to the keyword map (the results view replaces it). */
  onBackToMap?: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ onBackToMap }) => {
  const { gameResults, isLoading, error, sortBy, setSortBy, seedGame, lastSearchedFilters, totalCount, countIsCapped, hasMore, searchFresh } = useFilters();
  const [shareCopied, setShareCopied] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [hideMobileControls, setHideMobileControls] = useState(false);
  const [forgeCycle, setForgeCycle] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const startedFreshSearchRef = useRef(false);

  // Update hasSearched when a search is performed
  useEffect(() => {
    if (isLoading) {
      setHasSearched(true);
    }
  }, [isLoading]);

  // A fresh search clears the grid before loading. Advance the cycle only for
  // that state so sorting, expanding, and pagination never re-forge old cards.
  useEffect(() => {
    const isFreshSearch = isLoading && gameResults.length === 0;
    if (isFreshSearch && !startedFreshSearchRef.current) {
      startedFreshSearchRef.current = true;
      setForgeCycle(cycle => cycle + 1);
      setSelectedGameId(null);
    } else if (!isLoading) {
      startedFreshSearchRef.current = false;
    }
  }, [gameResults.length, isLoading]);

  // A fresh search empties gameResults at once. Keep the batch that was on
  // screen (with its forge cycle, so React keeps the same cards) and fade it
  // out of its sockets before the rack takes over.
  type Batch = { results: typeof gameResults; cycle: number; rarity: RarityTier | null };
  const shownBatchRef = useRef<Batch | null>(null);
  const [, setLeaveTick] = useState(0);
  if (gameResults.length > 0) {
    shownBatchRef.current = { results: gameResults, cycle: forgeCycle, rarity: getRarity(totalCount ?? gameResults.length) };
  } else if (!isLoading) {
    shownBatchRef.current = null;
  }
  const leavingBatch = isLoading && gameResults.length === 0 ? shownBatchRef.current : null;
  useEffect(() => {
    if (!leavingBatch) return;
    const timer = setTimeout(() => {
      shownBatchRef.current = null;
      setLeaveTick(tick => tick + 1);
    }, CARD_LEAVE_MS);
    return () => clearTimeout(timer);
  }, [leavingBatch]);

  const selectedGame = gameResults.find(g => g.id === selectedGameId) ?? null;

  // The expanded card keeps its matched keywords lit on the map.
  useEffect(() => {
    setSelectedCard(selectedGame ? cardLinkFor(selectedGame) : null);
  }, [selectedGame]);
  useEffect(() => () => {
    setSelectedCard(null);
    setHoveredCard(null);
  }, []);

  // Map keyword hovered → light up the cards that have it. Toggled on the DOM
  // directly so hovering around the map doesn't re-render every card.
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let lit: Element[] = [];
    return subscribeMapLink(() => {
      const id = getMapLink().mapKeywordId;
      lit.forEach(el => el.classList.remove('is-map-echo'));
      lit = id === null || !gridRef.current ? [] : Array.from(gridRef.current.querySelectorAll(`[data-kws~="${id}"]`));
      lit.forEach(el => el.classList.add('is-map-echo'));
    });
  }, []);

  // Empty sockets take the height of a resting card. Watch a card, not the
  // grid: the sockets live in the grid, so resizing them would re-trigger the
  // observer. Set on :root so SocketRack's next pre-search rack matches too.
  const firstGameId = gameResults[0]?.id;
  useEffect(() => {
    const slot = gridRef.current?.querySelector<HTMLElement>('.game-card-slot');
    if (!slot) return;
    const root = document.documentElement;
    const measure = () => {
      // Skip an expanded card, and the last callback as a batch leaves: a
      // detached slot measures 0 and would collapse every empty socket.
      if (!slot.isConnected || slot.classList.contains('game-card-slot-selected')) return;
      const rect = slot.getBoundingClientRect();
      if (rect.height === 0) return;
      const height = `${rect.height}px`;
      if (root.style.getPropertyValue('--socket-h') !== height) root.style.setProperty('--socket-h', height);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    measure();
    return () => observer.disconnect();
  }, [firstGameId]);

  useEffect(() => {
    if (selectedGameId !== null) {
      document.body.style.overflow = 'hidden';
      window.history.pushState({ gamefinder: 'game-card' }, '');
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedGameId]);

  useEffect(() => {
    const handlePopState = () => {
      if (selectedGameId !== null) setSelectedGameId(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedGameId]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const getScrollParent = (element: HTMLElement): HTMLElement | Window => {
      let parent = element.parentElement;
      while (parent) {
        const overflowY = window.getComputedStyle(parent).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') return parent;
        parent = parent.parentElement;
      }
      return window;
    };

    const scrollParent = getScrollParent(section);
    let lastScrollTop = scrollParent instanceof Window
      ? scrollParent.scrollY
      : scrollParent.scrollTop;

    const handleScroll = () => {
      if (!window.matchMedia('(max-width: 1023px)').matches || selectedGameId) {
        setHideMobileControls(false);
        return;
      }

      const currentScrollTop = scrollParent instanceof Window
        ? scrollParent.scrollY
        : scrollParent.scrollTop;
      const delta = currentScrollTop - lastScrollTop;

      if (currentScrollTop <= 12) {
        setHideMobileControls(false);
      } else if (delta > 8) {
        setHideMobileControls(true);
      } else if (delta < -8) {
        setHideMobileControls(false);
      }

      lastScrollTop = Math.max(currentScrollTop, 0);
    };

    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      scrollParent.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [selectedGameId]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: 'GameFinder', url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  // The results grid, also used for a batch fading out (leaving): same keys
  // and sockets, no entry animation. The table keeps at least RACK_SIZE
  // sockets, plus a row for more while more can load; unfilled ones stay empty.
  const renderGrid = (results: typeof gameResults, rarity: RarityTier | null, cycle: number, leaving: boolean) => {
    const socketCount = Math.max(RACK_SIZE, results.length + (results.length % 2) + (hasMore && !leaving ? 2 : 0));
    return (
      <div ref={gridRef} className={`grid grid-cols-1 widescreen:grid-cols-2 gap-7 ${leaving ? 'results-grid--leaving' : ''}`}>
        {results.map((game, index) => (
          <motion.div
            layout
            transition={CARD_LAYOUT_TRANSITION}
            key={`forge-${cycle}-${game.id}`}
            className={`${leaving ? '' : 'game-card-appear'} game-card-slot game-card-slot-rarity-${rarity ?? 'common'} ${selectedGameId === game.id ? 'game-card-slot-selected' : 'h-full'}`}
            style={{ '--forge-delay': `${Math.min(index, 7) * 65}ms`, ...socketFloorStyle(index) } as React.CSSProperties}
            data-kws={game.keywords?.map((k: { id: number }) => k.id).join(' ')}
            onMouseEnter={() => setHoveredCard(cardLinkFor(game))}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <GameCard
              game={game}
              isSelected={selectedGameId === game.id}
              highlightFilters={selectedGameId === game.id}
              rarity={rarity}
              desktopExpandDirection={index % 2 === 0 ? 'right' : 'left'}
              onSelect={() => setSelectedGameId(current => current === game.id ? null : game.id)}
            />
          </motion.div>
        ))}
        {Array.from({ length: socketCount - results.length }, (_, i) => (
          <div
            key={`socket-${i}`}
            className="card-socket-empty"
            style={socketFloorStyle(results.length + i)}
            aria-hidden
          />
        ))}
      </div>
    );
  };

  // Render different states based on loading and results
  const renderContent = () => {
    // The previous batch fades out of its sockets before the rack takes over.
    // Same child positions as the results branch below (summary, grid,
    // load more), so React keeps the cards instead of remounting them.
    if (leavingBatch) {
      return (
        <>
          <div className="results-summary results-summary--placeholder" aria-hidden />
          {renderGrid(leavingBatch.results, leavingBatch.rarity, leavingBatch.cycle, true)}
          {null}
        </>
      );
    }

    // Before any results exist, the table already shows its empty sockets.
    if (isLoading && gameResults.length === 0) {
      return <div className="socket-rack-stage"><SocketRack /><LoadingState /></div>;
    }
    
    if (!hasSearched) {
      return <div className="socket-rack-stage"><SocketRack /></div>;
    }

    if (!isLoading && gameResults.length === 0 && hasSearched) {
      return <EmptyState />;
    }

    if (gameResults.length > 0) {
      const displayCount = totalCount ?? gameResults.length;
      const rarity = getRarity(displayCount);
      const rgbVar = rarity ? RARITY_RGB[rarity] : '--c-border-rgb';
      const textVar = rarity ? RARITY_TEXT[rarity] : '--c-muted';
      const includedFilters = lastSearchedFilters.filter((f: Filter) => f.mode !== 'exclude');
      const excludedFilters = lastSearchedFilters.filter((f: Filter) => f.mode === 'exclude');

      return (
        <>
          <div className="results-summary"
               style={{ '--rarity-rgb': `var(${rgbVar})`, '--rarity-text': `var(${textVar})` } as React.CSSProperties}>
            <span className="results-summary-count">
              {countIsCapped ? `${displayCount}+` : displayCount} {displayCount === 1 && !countIsCapped ? 'Result' : 'Results'}
            </span>
            {rarity && rarity !== 'common' && (
              <span className="results-summary-rarity">{rarity}</span>
            )}
            {seedGame && (
              <span className="results-summary-seed">similar to <span>{seedGame.name}</span></span>
            )}
            {(includedFilters.length > 0 || excludedFilters.length > 0) && (
              <span className="results-summary-sep" aria-hidden />
            )}
            {includedFilters.map(f => (
              <span key={`${f.id}-${f.category}`} className="results-summary-chip">{f.name}</span>
            ))}
            {excludedFilters.map(f => (
              <span key={`excl-${f.id}-${f.category}`} className="results-summary-chip results-summary-chip--excluded">{f.name}</span>
            ))}
          </div>

          {renderGrid(gameResults, rarity, forgeCycle, false)}

          <LoadMoreButton />
        </>
      );
    }

    return null;
  };

  return (
    <>
    <AnimatePresence>
      {selectedGame && (
        <motion.div
          key="mobile-fullscreen"
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-slate-950 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-3">
            <GameCard
              game={selectedGame}
              isSelected={true}
              fullscreen={true}
              highlightFilters={true}
              rarity={getRarity(totalCount ?? gameResults.length)}
              onSelect={() => setSelectedGameId(null)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    <section ref={sectionRef} className="flex min-h-0 flex-1 flex-col w-full mx-auto">
      {/* Mobile: the results view's header — back to the map, refine, sort, share. Hides on scroll down. */}
      <div className={`mobile-results-header ${hideMobileControls ? 'mobile-results-header--hidden' : ''}`}>
        {onBackToMap && (
          <button type="button" className="mobile-results-back" onClick={onBackToMap} aria-label="Back to the keyword map">
            <ChevronLeft aria-hidden="true" />
            Map
          </button>
        )}
        <div className="mobile-results-tools">
          <MobileFilterSheet />
          <div className="results-sort-control">
            <select
              className="results-sort-select"
              value={sortBy}
              onChange={handleSortChange}
              aria-label="Sort results"
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Rating</option>
              <option value="release">Release Date</option>
              <option value="name">Name</option>
            </select>
          </div>
          {searchFresh && gameResults.length > 0 && (
            <button type="button" className="mobile-results-icon" onClick={handleShare} aria-label={shareCopied ? 'Link copied' : 'Share results'}>
              {shareCopied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
            </button>
          )}
          <SavedGamesControl className="mobile-results-icon mobile-results-saved" />
        </div>
      </div>

      {/* Desktop-only sticky header — hidden on mobile via CSS */}
      <div className={`results-sticky-header ${hasSearched ? '' : 'results-sticky-header-pristine'}`}>
        <div className="flex w-full items-center justify-end gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <FilterBar />
            <div className="results-sort-control">
              <select
                className="results-sort-select"
                value={sortBy}
                onChange={handleSortChange}
                aria-label="Sort results"
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Rating</option>
                <option value="release">Release Date</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200">
          <p>Error: {error}</p>
        </div>
      )}
      
      {renderContent()}
    </section>
    </>
  );
};

export default SearchResults;
