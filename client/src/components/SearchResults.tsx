import React, { useState, useEffect, useRef } from 'react';
import { useFilters, Filter } from '../context/FilterContext';
import GameCard from './GameCard';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import LoadMoreButton from './LoadMoreButton';
import FilterBar from './FilterBar';
import MobileFilterSheet from './MobileFilterSheet';
import SearchPlaceholder from './SearchPlaceholder';
import { motion, AnimatePresence } from 'framer-motion';
import { cardLinkFor, setHoveredCard, setSelectedCard, subscribeMapLink, getMapLink } from '../lib/mapLink';
import { getRarity, type RarityTier } from '../lib/discoveryCards';

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

const CARD_LAYOUT_TRANSITION = {
  layout: {
    duration: 0.32,
    ease: [0.22, 1, 0.36, 1] as const,
  },
};

const SearchResults: React.FC = () => {
  const { gameResults, isLoading, error, sortBy, setSortBy, seedGame, lastSearchedFilters, totalCount, countIsCapped } = useFilters();
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

  // Render different states based on loading and results
  const renderContent = () => {
    if (isLoading && gameResults.length === 0) {
      return <LoadingState />;
    }
    
    if (!hasSearched) {
      return <SearchPlaceholder />;
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
          {seedGame && (
            <p className="mb-3 text-xs text-muted-foreground">
              Showing games similar to <span className="text-primary">{seedGame.name}</span> based on shared keywords.
            </p>
          )}
          <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-lg border px-3 py-2 text-xs"
               style={{
                 borderColor: `rgba(var(${rgbVar}), 0.2)`,
                 background: `rgba(var(${rgbVar}), 0.04)`,
               }}>
            <span className="shrink-0 font-heading text-sm font-semibold"
                  style={{ color: `var(${textVar})` }}>
              {countIsCapped ? `${displayCount}+` : displayCount} {displayCount === 1 && !countIsCapped ? 'Result' : 'Results'}
            </span>
            {rarity && rarity !== 'common' && (
              <span className="shrink-0 font-bold uppercase tracking-wider rounded border px-1.5 py-0.5"
                    style={{ fontSize: '0.58rem', color: `var(${textVar})`, borderColor: `rgba(var(${rgbVar}), 0.3)` }}>
                {rarity}
              </span>
            )}
            {(includedFilters.length > 0 || excludedFilters.length > 0) && (
              <span style={{ color: 'var(--c-dim)' }}>&middot;</span>
            )}
            {includedFilters.map((f, i) => (
              <React.Fragment key={`${f.id}-${f.category}`}>
                {i > 0 && <span style={{ color: 'var(--c-dim)' }}>&middot;</span>}
                <span style={{ color: `var(${textVar})` }}>{f.name}</span>
              </React.Fragment>
            ))}
            {excludedFilters.map(f => (
              <React.Fragment key={`excl-${f.id}-${f.category}`}>
                <span style={{ color: 'var(--c-dim)' }}>&middot;</span>
                <span className="line-through" style={{ color: 'var(--c-dim)' }}>{f.name}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Mobile floating controls bar — sticky, directly above cards */}
          <div className={`mobile-controls-bar ${hideMobileControls ? 'mobile-controls-bar-hidden' : ''}`}>
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
          </div>

          <div ref={gridRef} className="grid grid-cols-1 widescreen:grid-cols-2 gap-4">
            {gameResults.map((game, index) => (
              <motion.div
                layout
                transition={CARD_LAYOUT_TRANSITION}
                key={`forge-${forgeCycle}-${game.id}`}
                className={`game-card-appear game-card-slot game-card-slot-rarity-${rarity ?? 'common'} ${selectedGameId === game.id ? 'game-card-slot-selected' : 'h-full'}`}
                style={{ '--forge-delay': `${Math.min(index, 7) * 65}ms` } as React.CSSProperties}
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
          </div>

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
