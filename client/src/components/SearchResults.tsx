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

type RarityTier = "common" | "uncommon" | "rare" | "epic" | "unique";

function getRarity(count: number): RarityTier | null {
  if (count <= 0)   return null;
  if (count <= 5)   return "unique";
  if (count <= 20)  return "epic";
  if (count <= 50)  return "rare";
  if (count <= 150) return "uncommon";
  return "common";
}

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

const SearchResults: React.FC = () => {
  const { gameResults, isLoading, error, sortBy, setSortBy, seedGame, lastSearchedFilters, totalCount, countIsCapped } = useFilters();
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [hideMobileControls, setHideMobileControls] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Update hasSearched when a search is performed
  useEffect(() => {
    if (isLoading) {
      setHasSearched(true);
    }
  }, [isLoading]);

  const selectedGame = gameResults.find(g => g.id === selectedGameId) ?? null;

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

          <div className="grid grid-cols-1 widescreen:grid-cols-2 gap-4">
            {gameResults.map((game, index) => (
              <motion.div
                key={`game-${game.id}`}
                className={selectedGameId === game.id ? 'widescreen:col-span-2' : 'h-full'}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(index * 0.07, 0.45),
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <GameCard
                  game={game}
                  isSelected={selectedGameId === game.id}
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
              onSelect={() => setSelectedGameId(null)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    <section ref={sectionRef} className="flex min-h-0 flex-1 flex-col w-full mx-auto">
      <div className={`results-sticky-header ${hasSearched ? '' : 'results-sticky-header-pristine'} ${hideMobileControls ? 'results-sticky-header-mobile-hidden' : ''}`}>
        <div className="flex w-full items-center justify-end gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="lg:hidden"><MobileFilterSheet /></span>
            <span className="hidden lg:contents"><FilterBar /></span>

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
