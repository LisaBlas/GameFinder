import React from 'react';
import { X, Search } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { SelectedFilters } from './SelectedFilters';

interface BottomBarProps {
  resetSections: () => void;
  resultsSectionRef: React.RefObject<HTMLDivElement>;
  onSearchSuccess?: () => void;
}

const BottomBar: React.FC<BottomBarProps> = ({ resetSections, resultsSectionRef, onSearchSuccess }) => {
  const { clearAllFilters, searchGames, selectedFilters, isLoading } = useFilters();

  const handleSearch = async () => {
    onSearchSuccess?.();
    await searchGames();
    resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    resetSections();
  };

  const handleClearAll = () => {
    clearAllFilters();
    resetSections();
  };

  return (
    <div
      className={`shrink-0 flex items-center gap-4 px-4 py-3 border-t transition-all duration-300 bg-background/80 backdrop-blur-sm ${
        selectedFilters.length > 0
          ? 'border-[#f5a614]/50 shadow-[0_-4px_20px_rgba(245,166,10,0.15)]'
          : 'border-border'
      }`}
    >
      {selectedFilters.length > 0 && (
        <div className="flex-1 min-w-0">
          <SelectedFilters />
        </div>
      )}

      <div className={`flex items-center gap-4 shrink-0 ${selectedFilters.length === 0 ? 'mx-auto' : ''}`}>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white border border-border bg-background hover:bg-red-500 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Clear
        </button>

        <button
          onClick={handleSearch}
          disabled={selectedFilters.length === 0 || isLoading}
          className={`hero-button flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 ${
            selectedFilters.length > 0
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-primary/50 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Search
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BottomBar;
