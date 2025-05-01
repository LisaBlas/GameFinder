import React from "react";
import { FilterCategory } from "./FilterCategory";
import { Filter } from "./Filter";
import { SelectedFilters } from "./SelectedFilters";
import { useFilters } from "../context/FilterContext";
import gameTags from "../assets/game-filters.json";
import categorizedKeywords from "../assets/all_categorised_keywords.json";
import keywordCategories from "../assets/keyword-categories.json";

interface KeywordItem {
  id: number;
  name: string;
  category: string;
  "sub-category": string;
  game_count: number;
}

interface CategoryItem {
  description: string;
  [key: string]: any;
}

interface CategoryMap {
  [key: string]: CategoryItem;
}

export const KeywordSection: React.FC = () => {
  // Category for filter context
  const category = 'Keywords';
  
  // Group keywords by their category and sub-category
  const keywordsByCategory: Record<string, Record<string, KeywordItem[]>> = {};
  
  // Process the categorized keywords
  categorizedKeywords.forEach((keyword: KeywordItem) => {
    const mainCategory = keyword.category;
    const subCategory = keyword["sub-category"];
    
    if (!keywordsByCategory[mainCategory]) {
      keywordsByCategory[mainCategory] = {};
    }
    
    if (!keywordsByCategory[mainCategory][subCategory]) {
      keywordsByCategory[mainCategory][subCategory] = [];
    }
    
    keywordsByCategory[mainCategory][subCategory].push(keyword);
  });

  return (
    <div className="keyword-section">
      <div className="keyword-section-header">
        <h3>Game Keywords</h3>
        <p className="text-slate-500 text-sm mt-2">Select keywords to find games matching your interests</p>
      </div>
      
      <div className="selected-tags-container">
        <div className="selected-tags-header">
          <h3>Selected Tags:</h3>
        </div>
        <div className="selected-tags-wrapper">
          <SelectedFilters />
        </div>
      </div>

      <div className="keyword-filters overflow-y-auto p-4">
        {Object.keys(keywordsByCategory).map((mainCategory) => (
          <div key={`main-category-${mainCategory}`} className="mb-8">
            <h3 className="text-lg font-semibold mb-4">{mainCategory}</h3>
            
            {Object.keys(keywordsByCategory[mainCategory]).map((subCategory) => {
              const keywords = keywordsByCategory[mainCategory][subCategory];
              if (keywords.length === 0) return null;
              
              return (
                <FilterCategory key={`subcategory-${subCategory}`} title={subCategory}>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword) => (
                      <Filter
                        key={`keyword-${keyword.id}`}
                        label={keyword.name}
                        id={keyword.id}
                        category={category}
                        endpoint="keywords"
                        slug={typeof keyword.name === 'string' ? keyword.name.toLowerCase() : ''}
                      />
                    ))}
                  </div>
                </FilterCategory>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};