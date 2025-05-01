import React from "react";
import { FilterCategory } from "@/components/FilterCategory";
import { Filter } from "@/components/Filter";
import { SelectedFilters } from "@/components/SelectedFilters";
import { useFilters } from "../context/FilterContext";
import gameTags from "@/assets/game-filters.json";

interface KeywordItem {
  id: string | number;
  name: string;
  category?: string;
  endpoint?: string;
  slug?: string;
  children?: KeywordItem[];
  hasChildren?: boolean;
  isParentOnly?: boolean;
}

interface KeywordCategories {
  [key: string]: KeywordItem[];
}

export const KeywordSection: React.FC = () => {
  // Extract only the Keywords category from the game tags
  const category = 'Keywords';
  const keywordsByCategory: KeywordCategories = {};
  
  // Group keywords by their category property
  gameTags[category]?.forEach((item: KeywordItem) => {
    const subCategory = item.category || 'Uncategorized';
    if (!keywordsByCategory[subCategory]) {
      keywordsByCategory[subCategory] = [];
    }
    keywordsByCategory[subCategory].push(item);
  });

  return (
    <div className="keyword-section">
      <div className="keyword-section-header">
        <h3>Keywords</h3>
      </div>
      
      <div className="selected-tags-container">
        <div className="selected-tags-header">
          <h3>Selected Tags:</h3>
        </div>
        <div className="selected-tags-wrapper">
          <SelectedFilters />
        </div>
      </div>

      <div className="keyword-filters">
        <FilterCategory title={category}>
          {Object.entries(keywordsByCategory).map(([subCategory, items], subCatIndex) => {
            // Create a parent filter for each subcategory
            const parentId = `keyword-cat-${subCatIndex}`;
            return (
              <div key={`subcategory-${subCategory}`}>
                <Filter
                  key={`${category}-${parentId}-subcategory-${subCategory}`}
                  label={subCategory}
                  id={parentId}
                  slug={subCategory.toLowerCase()}
                  category={category}
                  endpoint="tags"
                  hasChildren={true}
                  isParentOnly={true}
                  kids={items}
                />
              </div>
            );
          })}
        </FilterCategory>
      </div>
    </div>
  );
};