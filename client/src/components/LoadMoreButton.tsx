import React from 'react';
import { useFilters } from '../context/FilterContext';

const LoadMoreButton: React.FC = () => {
  const { loadMoreGames, hasMore, isLoading, error, retryLoadMore } = useFilters();

  if (!hasMore) return null;

  const handleClick = () => {
    if (error) {
      retryLoadMore();
    } else {
      loadMoreGames();
    }
  };

  return (
    <div className="mt-8 flex justify-center">
      <button 
        className={`font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
          error 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-slate-700 hover:bg-slate-600 text-white'
        }`}
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : error ? (
          <>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry Loading
          </>
        ) : (
          <span>Load More Games</span>
        )}
      </button>
    </div>
  );
};

export default LoadMoreButton;
