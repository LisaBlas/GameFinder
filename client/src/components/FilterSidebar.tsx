import React from 'react';
import { FilterCategory } from './FilterCategory';
import { Filter } from './Filter';
import { SelectedFilters } from './SelectedFilters';
import SearchButton from './SearchButton';
import { useFilters } from '../context/FilterContext';
import filterData from '../lib/filters';

const FilterSidebar: React.FC = () => {
  const { clearAllFilters } = useFilters();

  return (
    <aside className="w-full md:w-80 lg:w-96 bg-slate-800 p-4 md:min-h-screen md:overflow-y-auto border-r border-slate-700">
      <div className="sticky top-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-heading font-semibold text-white">Filters</h2>
          <button 
            className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
            onClick={clearAllFilters}
          >
            Clear All
          </button>
        </div>
        
        <SelectedFilters />
        
        <div className="space-y-2">
          <FilterCategory title="platforms">
            <div className="flex flex-wrap gap-2">
              {filterData.platforms.map(platform => (
                <Filter
                  key={`platform-${platform.id}`}
                  id={platform.id}
                  label={platform.name}
                  category="platforms"
                  hasChildren={platform.hasChildren}
                  kids={platform.children}
                  isParentOnly={platform.isParentOnly}
                />
              ))}
            </div>
          </FilterCategory>
          
          <FilterCategory title="genres">
            <div className="flex flex-wrap gap-2">
              {filterData.genres.map(genre => (
                <Filter
                  key={`genre-${genre.id}`}
                  id={genre.id}
                  label={genre.name}
                  category="genres"
                  slug={genre.slug}
                />
              ))}
            </div>
          </FilterCategory>
          
          <FilterCategory title="themes">
            <div className="flex flex-wrap gap-2">
              {filterData.themes.map(theme => (
                <Filter
                  key={`theme-${theme.id}`}
                  id={theme.id}
                  label={theme.name}
                  category="themes"
                  slug={theme.slug}
                />
              ))}
            </div>
          </FilterCategory>
          
          <FilterCategory title="Game Mode">
            <div className="flex flex-wrap gap-2">
              {filterData["Game Mode"].map(mode => (
                <Filter
                  key={`mode-${mode.id}`}
                  id={mode.id}
                  label={mode.name}
                  category="Game Mode"
                />
              ))}
            </div>
          </FilterCategory>
          
          <FilterCategory title="Perspective">
            <div className="flex flex-wrap gap-2">
              {filterData.Perspective.map(perspective => (
                <Filter
                  key={`perspective-${perspective.id}`}
                  id={perspective.id}
                  label={perspective.name}
                  category="Perspective"
                />
              ))}
            </div>
          </FilterCategory>
          
          <FilterCategory title="Keywords">
            <div className="flex flex-wrap gap-2">
              {filterData.Keywords.map(keyword => (
                <Filter
                  key={`keyword-${keyword.id}`}
                  id={keyword.id}
                  label={keyword.name}
                  category="Keywords"
                />
              ))}
            </div>
          </FilterCategory>
        </div>
        
        <SearchButton />
      </div>
    </aside>
  );
};

export default FilterSidebar;
