import React, { useState, useEffect, useRef } from 'react';
import { useFilters } from '../context/FilterContext';
import GameCard from './GameCard';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import LoadMoreButton from './LoadMoreButton';
import { useMediaQuery } from '../hooks/useMediaQuery';

const SearchResults: React.FC = () => {
  const { gameResults, isLoading, error, sortBy, setSortBy, selectedFilters, hasMore } = useFilters();
  // layout: "grid" preserves the current multi-card layout; "list" forces 1 card per row across breakpoints
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const hasInitializedLayout = useRef(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)'); // aligns with Tailwind lg breakpoint
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Update hasSearched when a search is performed
  useEffect(() => {
    if (isLoading) {
      setHasSearched(true);
    }
  }, [isLoading]);

  // Initialize default layout based on screen size, once after mount
  useEffect(() => {
    if (hasInitializedLayout.current) return;
    // Default: phones -> grid (current layout); desktops -> list (1 card per row)
    setLayout(isDesktop ? 'list' : 'grid');
    hasInitializedLayout.current = true;
  }, [isDesktop]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  // Render different states based on loading and results
  const renderContent = () => {
    if (isLoading && gameResults.length === 0) {
      return <LoadingState />;
    }
    
    if (!isLoading && gameResults.length === 0 && hasSearched) {
      return <EmptyState />;
    }
    
    if (gameResults.length > 0) {
      const gridClasses =
        layout === 'grid'
          // Keep existing responsive behavior for the current layout
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          // Force 1 card per row at all sizes for the alternative layout
          : 'grid grid-cols-1 gap-6';
      return (
        <>
          <div className={gridClasses}>
            {gameResults.map(game => (
              <GameCard
                key={`game-${game.id}`}
                game={game}
                expanded={expandedGameId === game.id}
                onToggle={(next) => {
                  setExpandedGameId(prev => (next ? game.id : prev === game.id ? null : prev));
                }}
              />
            ))}
          </div>
          
          <LoadMoreButton />
        </>
      );
    }

    return null;
  };

  return (
    <section className="flex-1 w-full md:w-4/5 mx-auto">
      {/* Only show results header if we have results or have searched */}
      {hasSearched && (
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-heading font-semibold text-white">
            {gameResults.length}{hasMore ? '+' : ''} {gameResults.length === 1 ? 'Result' : 'Results'}
          </h2>
          
          <div className="flex items-center gap-4">
            {/* Layout toggle */}
            <div className="inline-flex items-center rounded-lg border border-slate-600 p-1 bg-slate-700">
              <button
                type="button"
                onClick={() => setLayout('grid')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  layout === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-200 hover:bg-slate-600'
                }`}
                aria-pressed={layout === 'grid'}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setLayout('list')}
                className={`ml-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  layout === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-200 hover:bg-slate-600'
                }`}
                aria-pressed={layout === 'list'}
              >
                List
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Sort by:</span>
              <select 
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={sortBy}
                onChange={handleSortChange}
              >
                <option value="rating">Rating</option>
                <option value="release">Release Date</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200">
          <p>Error: {error}</p>
        </div>
      )}
      
      {renderContent()}
    </section>
  );
};

export default SearchResults;
