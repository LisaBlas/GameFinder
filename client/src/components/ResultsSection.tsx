import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import SearchResults from './SearchResults';
import FilterSidebar from './FilterSidebar';
import { useFilters } from '../context/FilterContext';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

interface ResultsSectionProps {
  setActiveSection: (section: 'keywords' | 'results') => void;
  resultsSectionRef: React.RefObject<HTMLDivElement>;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ resultsSectionRef }) => {
  const { gameResults } = useFilters();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Only show filters if we have results
  const hasResults = gameResults.length > 0;

  return (
    <div
      ref={resultsSectionRef}
      className="game-results w-full py-8 flex flex-col items-center justify-start text-center transition-all relative"
    >
      {hasResults ? (
        <div className="w-full flex flex-col lg:flex-row gap-6 pb-24">
          {/* Main content - Results */}
          <div className="w-full lg:w-[70%]">
            <SearchResults />
          </div>

          {/* Desktop Sidebar - Filters */}
          <div className="hidden lg:block w-full lg:w-[30%]">
            <div className="sticky top-4">
              <FilterSidebar
                expanded={true}
                filterSectionRef={resultsSectionRef}
                heroRef={resultsSectionRef}
                inResultsSection={true}
              />
            </div>
          </div>

          {/* Mobile Filter Button */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden fixed bottom-20 right-4 z-40 bg-primary hover:bg-primary/90 text-white p-4 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="text-sm font-medium">Filters</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
              <FilterSidebar
                expanded={true}
                filterSectionRef={resultsSectionRef}
                heroRef={resultsSectionRef}
                inResultsSection={true}
              />
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="w-full flex flex-col pb-24">
          <SearchResults />
        </div>
      )}
    </div>
  );
};

export default ResultsSection;