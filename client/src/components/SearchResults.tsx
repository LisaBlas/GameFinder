import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import GameCard from './GameCard';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import LoadMoreButton from './LoadMoreButton';
import FilterBar from './FilterBar';
import { FaInfoCircle } from 'react-icons/fa';

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
    <section className="flex-1 w-full mx-auto">
      <div className={`results-sticky-header ${hasSearched ? '' : 'results-sticky-header-pristine'}`}>
        <div className="flex min-h-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <h2 className="shrink-0 text-2xl font-heading font-semibold text-white">
            {gameResults.length}{hasMore ? '+' : ''} {gameResults.length === 1 ? 'Result' : 'Results'}
          </h2>

          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <FilterBar />

            <div className="results-sort-control">
              <span>Sort</span>
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
  );
};

export default SearchResults;
