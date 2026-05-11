import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import GameCard from './GameCard';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import LoadMoreButton from './LoadMoreButton';
import FilterBar from './FilterBar';
import MobileFilterSheet from './MobileFilterSheet';
import { FaInfoCircle, FaTimes } from 'react-icons/fa';

const SearchResults: React.FC = () => {
  const { gameResults, isLoading, error, sortBy, setSortBy, hasMore } = useFilters();
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  // Update hasSearched when a search is performed
  useEffect(() => {
    if (isLoading) {
      setHasSearched(true);
    }
  }, [isLoading]);

  const selectedGame = gameResults.find(g => g.id === selectedGameId) ?? null;

  useEffect(() => {
    if (selectedGameId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedGameId]);

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
      return (
        <>
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-slate-700/40 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
            <FaInfoCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
            <span>We only list reputable sellers. Prices may vary; check seller ratings before purchase.</span>
          </div>

          <div className="flex flex-col gap-4">
            {gameResults.map(game => (
              <GameCard
                key={`game-${game.id}`}
                game={game}
                isSelected={selectedGameId === game.id}
                onSelect={() => setSelectedGameId(current => current === game.id ? null : game.id)}
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
    <>
    {selectedGame && (
      <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-slate-950 lg:hidden">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
          <button
            onClick={() => setSelectedGameId(null)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            <FaTimes className="h-4 w-4" />
          </button>
          <h2 className="truncate text-sm font-semibold text-white">{selectedGame.name}</h2>
        </div>
        <div className="p-3">
          <GameCard
            game={selectedGame}
            isSelected={true}
            fullscreen={true}
            onSelect={() => setSelectedGameId(null)}
          />
        </div>
      </div>
    )}
    <section className="flex-1 w-full mx-auto">
      <div className={`results-sticky-header ${hasSearched ? '' : 'results-sticky-header-pristine'}`}>
        <div className="flex w-full items-center justify-end lg:justify-between gap-3">
          <h2 className="hidden lg:block shrink-0 text-2xl font-heading font-semibold text-white">
            {gameResults.length}{hasMore ? '+' : ''} {gameResults.length === 1 ? 'Result' : 'Results'}
          </h2>

          <div className="flex min-w-0 items-center gap-2">
            <span className="lg:hidden"><MobileFilterSheet /></span>
            <span className="hidden lg:contents"><FilterBar /></span>

            <div className="results-sort-control">
              <select
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
