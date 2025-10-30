import React, { useEffect, useState } from 'react';
import { FilterCategory } from './FilterCategory';
import { Filter } from './Filter';
import filterData from '../lib/filters';
import { SlidersHorizontal, Search, X, ArrowLeft } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { HelpTooltip } from './HelpTooltip';

interface FilterSidebarProps {
  expanded: boolean;
  setActiveSection: (section: 'keywords' | 'filters' | 'none') => void;
  filterSectionRef: React.RefObject<HTMLDivElement>;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ expanded, setActiveSection, filterSectionRef }) => {
  const { searchGames, selectedFilters, isLoading, clearAllFilters, setCategoryExpanded } = useFilters();

  useEffect(() => {
    if (expanded) {
      setCategoryExpanded('platforms', true);
    }
  }, [expanded, setCategoryExpanded]);

  if (!expanded) {
    return (
      <div
        className={`
          filter-section px-4 w-full bg-transparent rounded-lg overflow-hidden flex flex-col 
          hover:items-center hover:border-primary/90 justify-center text-center py-10 cursor-pointer
          animate-[shadow-pulse_2s_ease-in-out_infinite]
          border-2 border-primary/20 animate-[border-pulse_2s_ease-in-out_infinite]
          min-h-[180px] transition-all duration-500 relative
          ${!expanded ? 'lg:mt-auto lg:mb-auto' : ''}
        `}
        onClick={() => {
          setActiveSection('filters');
          // Scroll to filter section on both mobile and desktop
          filterSectionRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }}
        style={{ userSelect: 'none', position: 'relative' }}
      >
        <HelpTooltip
          title="Filter Tips"
          content="Careful not to use too many filters, as this may limit your results. Use this section to hide irrelevant games."
          isExpanded={expanded}
        />
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex items-center justify-center mb-2">
            <span className="text-4xl font-bold text-primary">2.</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-wide mb-1">
            Add Some Filters
          </h2>
          <p className="category-description text-base md:text-lg text-secondary-foreground/80 mb-2 max-w-xl mx-auto">
            (Optional) Focus your results by showing only what fits
          </p>
          <p className="text-lm text-primary/60 animate-pulse">Click to expand</p>
        </div>
      </div>
    );
  }

  return (
    <div className="filter-section w-full bg-card rounded-lg overflow-hidden flex flex-col items-center justify-start text-center transition-all duration-500 h-auto">
      <div className="w-full bg-primary/10 border-b border-primary/40 py-3 relative">
        <HelpTooltip
          title="Filter Tips"
          content="Careful not to use too many filters, as this may limit your results. Use this section to hide irrelevant games."
          isExpanded={true}
        />
        <div className="flex items-center justify-center gap-3 relative">
          <button 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary hover:text-primary/80 flex items-center"
            onClick={() => {
              const section = document.querySelector('.filter-section');
              if (section) {
                section.classList.add('collapsing');
              }
              
              setTimeout(() => {
                setActiveSection('none');
              }, 500);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <span className="text-2xl font-bold text-primary">2.</span>
          <h2 className="text-xl font-extrabold text-primary tracking-wide">
            Refine Your Search
          </h2>
        </div>
      </div>

      <div className="w-full max-w-[500px] mx-auto flex flex-col px-4 pb-24 mt-6 overflow-y-auto">
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
