import React from 'react';
import { ChevronDown, Filter as FilterIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Filter } from './Filter';
import filterData from '../lib/filters';
import { useFilters } from '../context/FilterContext';

type FilterCategoryConfig = {
  key: keyof typeof filterData;
  label: string;
  category: string;
};

const categories: FilterCategoryConfig[] = [
  { key: 'platforms', label: 'Platform', category: 'platforms' },
  { key: 'genres', label: 'Genre', category: 'genres' },
  { key: 'themes', label: 'Theme', category: 'themes' },
  { key: 'Game Mode', label: 'Mode', category: 'Game Mode' },
  { key: 'Perspective', label: 'Perspective', category: 'Perspective' },
];

const FilterBar: React.FC = () => {
  const { selectedFilters } = useFilters();

  const getSelectedCount = (category: string) =>
    selectedFilters.filter(filter => filter.category === category).length;

  return (
    <div className="results-filter-bar">
      <div className="flex items-center gap-2 pr-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <FilterIcon className="h-4 w-4 text-primary" />
        <span>Filters</span>
      </div>

      <div className="results-filter-scroll">
        {categories.map(({ key, label, category }) => {
          const selectedCount = getSelectedCount(category);
          const options = filterData[key] as any[];

          return (
            <Popover key={category}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'results-filter-trigger',
                    selectedCount > 0 && 'results-filter-trigger-active'
                  )}
                >
                  <span>{label}</span>
                  {selectedCount > 0 && (
                    <span className="results-filter-count">{selectedCount}</span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="start"
                sideOffset={8}
                className="w-[min(420px,calc(100vw-2rem))] border-border bg-card/95 p-3 shadow-2xl backdrop-blur"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                  {selectedCount > 0 && (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                      {selectedCount} selected
                    </span>
                  )}
                </div>

                <div className="flex max-h-[360px] flex-wrap gap-2 overflow-y-auto pr-1">
                  {options.map(option => (
                    <Filter
                      key={`${category}-${option.id}`}
                      id={option.id}
                      label={option.name}
                      category={category}
                      slug={option.slug}
                      hasChildren={option.hasChildren}
                      kids={option.children}
                      isParentOnly={option.isParentOnly}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </div>
  );
};

export default FilterBar;
