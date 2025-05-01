import React from 'react';
import { FilterCategory } from "@/components/FilterCategory";
import { Filter } from "@/components/Filter";
import { FilterActionBar } from "@/components/FilterActionBar";
import { useFilters } from "../FilterContext";
import gameTags from "@/assets/game-filters.json";

interface FilterItem {
  id: string | number;
  name: string;
  category?: string;
  endpoint?: string;
  slug?: string;
  children?: FilterItem[];
  hasChildren?: boolean;
  isParentOnly?: boolean;
}

interface GameTags {
  [key: string]: FilterItem[];
}

export const FilterSection = () => {
  const { selectedFilters, addFilter } = useFilters();
  
  // Filter out the Keywords category, as it will be handled separately in KeywordSection
  const categorieNames = Object.keys(gameTags).filter(name => name !== 'Keywords');
  
  const categories = categorieNames.map(category => {
    // Standard handling for all categories (Keywords is now excluded)
    const categoryItems = gameTags[category as keyof typeof gameTags] as FilterItem[];
    
    return (
      <FilterCategory key={category} title={category}>
        {[...categoryItems]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((item, index) => {
          // Prefix internal IDs for parent-only filters
          const itemId = item.isParentOnly ? `parent-${item.slug || index}` : item.id;

          return (
            <Filter 
              key={`${category}-${itemId}-${item.endpoint || ""}-${item.slug || ""}-${index}`}
              label={item.name}
              id={itemId}
              slug={item.slug || ""}
              category={category}
              endpoint={item.endpoint || ""}
              kids={item.children || []}
              hasChildren={item.children && item.children.length > 0}
              isParentOnly={item.isParentOnly === true}
            />
          );
        })}
      </FilterCategory>
    );
  });

  return (
    <aside className="filters">
      <div className="filters-header">
        <h2>Filter Games</h2>
      </div>

      <div className="filters-content">
        {categories}
        {/* Add a spacer div to ensure content isn't hidden behind the fixed bar */}
        <div className="filters-bottom-spacer"></div>
      </div>

      <FilterActionBar />
    </aside>
  );
};
