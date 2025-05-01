import React from 'react';
import { useFilters } from '../context/FilterContext';
import { X } from 'lucide-react';

const SelectedFilters: React.FC = () => {
  const { selectedFilters, removeFilter } = useFilters();

  if (selectedFilters.length === 0) {
    return (
      <div className="mb-6 bg-slate-700/50 rounded-lg p-3 border border-slate-600">
        <h3 className="text-sm text-slate-400 mb-2">Selected Filters</h3>
        <p className="text-sm text-slate-400">No filters selected. Choose filters to search for games.</p>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-slate-700/50 rounded-lg p-3 border border-slate-600">
      <h3 className="text-sm text-slate-400 mb-2">Selected Filters</h3>
      <div className="flex flex-wrap gap-2">
        {selectedFilters.map((filter) => (
          <div 
            key={`${filter.category}-${filter.id}-${filter.endpoint || ''}`}
            className="bg-primary-500/20 border border-primary-500/30 text-primary-300 text-sm px-3 py-1 rounded-full flex items-center"
          >
            {filter.name}
            <button 
              className="ml-2 text-primary-300 hover:text-white transition-colors duration-200"
              onClick={() => removeFilter(filter.id, filter.category, filter.endpoint)}
              aria-label={`Remove ${filter.name} filter`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedFilters;
