import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Filter as FilterIcon, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Filter } from './Filter';
import filterData from '../lib/filters';
import { useFilters } from '../context/FilterContext';

type CategoryKey = keyof typeof filterData;

const CATEGORIES: { key: CategoryKey; label: string; category: string }[] = [
  { key: 'platforms', label: 'Platform', category: 'platforms' },
  { key: 'genres', label: 'Genre', category: 'genres' },
  { key: 'themes', label: 'Theme', category: 'themes' },
  { key: 'Game Mode', label: 'Mode', category: 'Game Mode' },
  { key: 'Perspective', label: 'Perspective', category: 'Perspective' },
];

const MobileFilterSheet: React.FC = () => {
  const { selectedFilters, clearAllFilters, searchGames } = useFilters();
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const nonKeywordFilters = selectedFilters.filter(f => f.category !== 'Keywords');
  const totalSelected = nonKeywordFilters.length;

  const getSelectedCount = (category: string) =>
    selectedFilters.filter(f => f.category === category).length;

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="relative inline-flex items-center gap-1.5 rounded-lg border border-[#245344] bg-[#0b211b] px-3 py-2 text-sm font-semibold text-[#dbeafe] transition-colors hover:border-primary hover:bg-primary/10">
          <FilterIcon className="h-4 w-4 text-primary" />
          {totalSelected > 0 && (
            <span className="ml-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
              {totalSelected}
            </span>
          )}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col bg-[hsl(155,30%,9%)] focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5 text-primary" />
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Filters
              </Dialog.Title>
              {totalSelected > 0 && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                  {totalSelected} active
                </span>
              )}
            </div>
            <Dialog.Close asChild>
              <button className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-slate-800 hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {CATEGORIES.map(({ key, label, category }) => {
              const count = getSelectedCount(category);
              const isOpen = openCategory === category;
              const options = filterData[key] as any[];

              return (
                <div key={category} className="overflow-hidden rounded-lg border border-border">
                  <button
                    className="flex w-full items-center justify-between bg-[hsl(155,28%,7%)] px-4 py-3 text-left hover:bg-[hsl(155,26%,11%)] transition-colors"
                    onClick={() => setOpenCategory(isOpen ? null : category)}
                  >
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      {label}
                      {count > 0 && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                          {count}
                        </span>
                      )}
                    </span>
                    {isOpen
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    }
                  </button>

                  {isOpen && (
                    <div className="flex flex-wrap gap-2 border-t border-border bg-[hsl(155,30%,6%)] px-3 py-3">
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
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 gap-3 border-t border-border px-4 py-4">
            {totalSelected > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex-1 rounded-lg border border-border bg-transparent py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-red-500/60 hover:bg-red-900/20 hover:text-red-300"
              >
                Clear filters
              </button>
            )}
            <Dialog.Close asChild>
              <button
                onClick={() => searchGames()}
                className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Done
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default MobileFilterSheet;
