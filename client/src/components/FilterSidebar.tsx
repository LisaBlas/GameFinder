import React from 'react';
import { FilterCategory } from './FilterCategory';
import { Filter } from './Filter';
import { useFilters } from '../context/FilterContext';
import filterData from '../lib/filters';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface FilterSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ collapsed, onToggleCollapse }) => {
  return (
    <aside 
      className={`transition-all duration-300 ease-in-out ${
        collapsed 
          ? 'w-12 md:w-12 p-0' 
          : 'w-full md:w-80 lg:w-96 bg-slate-800 p-4 md:min-h-screen md:overflow-y-auto border-r border-slate-700'
      } relative`}
    >
      <button 
        className={`absolute z-10 ${
          collapsed 
            ? 'top-4 left-1 p-2 text-slate-800 hover:text-slate-600' 
            : 'top-4 right-4 p-2 rounded-full bg-slate-700 text-white hover:bg-slate-600'
        } transition-colors`}
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <SlidersHorizontal size={20} />
        ) : (
          <ChevronLeft size={16} />
        )}
      </button>
      
      {!collapsed && (
        <div className="sticky top-4 pt-2">
          <div className="mb-6">
            <h2 className="text-xl font-heading font-semibold text-white">Filters</h2>
          </div>
          
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
          </div>
        </div>
      )}
    </aside>
  );
};

export default FilterSidebar;
