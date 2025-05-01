import React, { useState } from 'react';
import { useFilters } from '../context/FilterContext';
import GameCard from './GameCard';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import LoadMoreButton from './LoadMoreButton';
import { LayoutGrid, List } from 'lucide-react';

type ViewMode = 'grid' | 'list';

const SearchResults: React.FC = () => {
  const { gameResults, isLoading, error, sortBy, setSortBy } = useFilters();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  // Render different states based on loading and results
  const renderContent = () => {
    if (isLoading && gameResults.length === 0) {
      return <LoadingState />;
    }
    
    if (!isLoading && gameResults.length === 0) {
      return <EmptyState />;
    }
    
    return (
      <>
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
          }
        `}>
          {gameResults.map(game => (
            <GameCard key={`game-${game.id}`} game={game} />
          ))}
        </div>
        
        <LoadMoreButton />
      </>
    );
  };

  return (
    <section className="flex-1 p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-heading font-semibold text-white">Game Results</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Sort by:</span>
            <select 
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Rating</option>
              <option value="release">Release Date</option>
              <option value="name">Name</option>
            </select>
          </div>
          
          <div className="flex items-center bg-slate-700 rounded-lg p-0.5">
            <button 
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-600 hover:text-white'} transition-colors duration-200`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-600 hover:text-white'} transition-colors duration-200`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
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
