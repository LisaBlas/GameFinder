import React from 'react';
import { SearchX } from 'lucide-react';
import { useFilters } from '../context/FilterContext';

const EmptyState: React.FC = () => {
  const { selectedFilters } = useFilters();
  const keywordCount = selectedFilters.filter(f => f.category === 'Keywords').length;

  return (
    <div className="pointer-events-none flex flex-1 items-center justify-center px-6 pb-16 text-center">
      <div className="max-w-2xl">
        <SearchX className="etched-placeholder-icon mx-auto mb-6 h-16 w-16 sm:h-20 sm:w-20" />
        <p className="etched-placeholder-title font-cinzel text-3xl font-normal uppercase leading-tight tracking-[0.18em] sm:text-4xl lg:text-5xl">
          No Games Found
        </p>
        <p className="etched-placeholder-subtitle mt-5 font-cinzel text-xs font-normal uppercase tracking-[0.24em] sm:text-sm">
          {keywordCount > 1
            ? <>No games match all {keywordCount} keywords at once. Try removing one.</>
            : <>Try using fewer keywords or adjusting your filters.</>
          }
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
