import React from 'react';
import { useFilters } from '../context/FilterContext';
import { Search } from 'lucide-react';

const SearchButton: React.FC = () => {
  const { searchGames, selectedFilters, isLoading } = useFilters();

  const handleSearch = () => {
    if (selectedFilters.length > 0) {
      searchGames();
    }
  };

  return (
    <div className="mt-6">
      <button 
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        onClick={handleSearch}
        disabled={selectedFilters.length === 0 || isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Searching...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Search Games
          </>
        )}
      </button>
    </div>
  );
};

export default SearchButton;
