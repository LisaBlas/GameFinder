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
  const hasSearchableFilters = selectedFilters.some(filter => filter.mode !== "exclude");

  const handleSearch = async () => {
    if (!hasSearchableFilters) return;
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
      className={`mobile-action-bar shrink-0 border-t transition-all duration-300 bg-background/90 backdrop-blur-sm ${
        selectedFilters.length > 0
          ? 'border-[#f5a614]/50 shadow-[0_-4px_20px_rgba(245,166,10,0.15)]'
          : 'border-border'
      }`}
    >
      <div className="mobile-action-selection">
        <SelectedFilters variant="lanes" />
      </div>

      <div className="mobile-action-buttons">
        <button
          onClick={handleClearAll}
          disabled={selectedFilters.length === 0}
          className="mobile-action-button mobile-action-button-clear"
        >
          <X className="w-4 h-4" />
          Clear
        </button>

        <button
          onClick={handleSearch}
          disabled={!hasSearchableFilters || isLoading}
          className={`hero-button mobile-action-button mobile-action-button-search ${
            hasSearchableFilters
              ? 'mobile-action-button-search-active'
              : 'mobile-action-button-search-disabled'
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
