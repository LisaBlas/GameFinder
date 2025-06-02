import React from 'react';
import { X, Search } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { SelectedFilters } from './SelectedFilters';

interface BottomBarProps {
  resetSections: () => void;
  resultsSectionRef: React.RefObject<HTMLDivElement>;
}

const BottomBar: React.FC<BottomBarProps> = ({ resetSections, resultsSectionRef }) => {
  const { clearAllFilters, searchGames, selectedFilters, isLoading } = useFilters();

  const handleSearch = async () => {
    await searchGames();
    // Scroll to results section after search is complete
    resultsSectionRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
    resetSections();
  };

  const handleClearAll = () => {
    clearAllFilters();
    resetSections();
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bottom-bar fixed bottom-0 left-0 right-0 flex justify-center items-center p-4 z-50 animate-in slide-in-from-bottom duration-300 pointer-events-none">
      <div className="rounded-t-lg pointer-events-none">
        <div className="flex flex-col items-center gap-4 p-4 pointer-events-none">
          {/* Selected Filters */}
          <div className={`backdrop-blur-sm inline-flex rounded-lg p-4 transition-all duration-300 pointer-events-auto ${
            selectedFilters.length > 0 
              ? 'border-2 border-[#f5a614]/90 shadow-[0_0_10px_rgba(245,166,10,0.3)]' 
              : 'border border-border'
          }`}>
            <div className="selected-tags-wrapper">
              <SelectedFilters />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 pointer-events-auto">
            <button
              onClick={handleClearAll}
              className="bg-background flex items-center gap-2 px-4 py-2 text-sm font-medium text-white border border-border hover:bg-red-500 rounded-lg transition-colors"
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
      </div>
    </div>
  );
};

export default BottomBar; 