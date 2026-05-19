import React from 'react';
import { SearchX } from 'lucide-react';
import { useFilters } from '../context/FilterContext';

const EmptyState: React.FC = () => {
  const { selectedFilters } = useFilters();
  const keywordCount = selectedFilters.filter(f => f.category === 'Keywords').length;

  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 mb-6 text-slate-600">
        <SearchX className="w-full h-full" />
      </div>
      <h3 className="text-2xl font-medium text-white mb-3">No Games Found</h3>
      <p className="text-slate-400 max-w-md text-lg">
        {keywordCount > 1
          ? <>No games match <b className="text-slate-50">all {keywordCount} keywords</b> at once — try removing one.</>
          : <>Try using <b className="text-slate-50">fewer keywords</b> or <b className="text-slate-50">adjusting</b> your filters.</>
        }
      </p>
    </div>
  );
};

export default EmptyState;
