import React, { useEffect } from 'react';
import { FilterCategory } from './FilterCategory';
import { Filter } from './Filter';
import filterData from '../lib/filters';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { useFilters } from '../context/FilterContext';

interface FilterSidebarProps {
  expanded: boolean;
  setActiveSection: (section: 'keywords' | 'filters') => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ expanded, setActiveSection }) => {
  const { searchGames, selectedFilters, isLoading, clearAllFilters, setCategoryExpanded } = useFilters();

  useEffect(() => {
    if (expanded) {
      setCategoryExpanded('platforms', true);
    }
  }, [expanded, setCategoryExpanded]);

  if (!expanded) {
    return (
      <div
        className="filter-section w-full bg-card py-10 cursor-pointer flex flex-col items-center justify-center text-center hover:bg-muted/80 transition-all relative min-h-[180px]"
        onClick={() => setActiveSection('filters')}
        style={{ userSelect: 'none' }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center mb-2">
            <SlidersHorizontal className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-wide mb-1">
            Choose Up To 5 Filters
          </h2>
          <p className="text-base md:text-lg text-secondary-foreground/80 mb-2 max-w-xl mx-auto">
            Choose filters to narrow down your game results. Select platforms, genres, themes, and more to find your perfect game match!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="filter-section w-full bg-card flex flex-col items-center justify-start text-center transition-all relative h-[calc(100vh-200px)] overflow-y-auto"
    >
      <div className="w-full bg-primary/10 border-b border-primary/20 py-3 px-4">
        <div className="flex items-center justify-center gap-3">
          <SlidersHorizontal className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-extrabold text-primary tracking-wide">
            Choose Up To 5 Filters
          </h2>
        </div>
      </div>

      <div className="w-full max-w-[500px] mx-auto flex flex-col px-4 pb-24 mt-6">
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
                slug={(genre as any).slug}
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
                slug={(theme as any).slug}
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
  );
};

export default FilterSidebar;
