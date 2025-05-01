import React from 'react';
import { useFilters } from '../context/FilterContext';

const LoadMoreButton: React.FC = () => {
  const { loadMoreGames, hasMore, isLoading } = useFilters();

  if (!hasMore) return null;

  return (
    <div className="mt-8 flex justify-center">
      <button 
        className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        onClick={loadMoreGames}
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
        ) : (
          <span>Load More Games</span>
        )}
      </button>
    </div>
  );
};

export default LoadMoreButton;
