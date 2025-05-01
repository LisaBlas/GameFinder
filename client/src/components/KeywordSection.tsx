import React from "react";
import { FilterCategory } from "./FilterCategory";
import { Filter } from "./Filter";
import { SelectedFilters } from "./SelectedFilters";
import { useFilters } from "../context/FilterContext";
import topKeywordsByCategory from "../assets/top_keywords_by_category.json";

interface KeywordItem {
  id: number;
  name: string;
  category: string;
  "sub-category": string;
  game_count?: number;
}

export const KeywordSection: React.FC = () => {
  // Category for filter context
  const category = 'Keywords';

  return (
    <div className="keyword-section bg-white rounded-lg shadow-md overflow-hidden">
      <div className="keyword-section-header bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
        <h3 className="text-xl font-semibold">Game Keywords</h3>
        <p className="text-white/80 text-sm mt-1">Select keywords to find games matching your interests</p>
      </div>
      
      <div className="selected-tags-container bg-gray-50 p-4 border-b border-gray-200">
        <div className="selected-tags-header mb-2">
          <h3 className="text-sm font-medium text-gray-700">Selected Tags:</h3>
        </div>
        <div className="selected-tags-wrapper">
          <SelectedFilters />
        </div>
      </div>

      <div className="keyword-filters overflow-y-auto p-4 max-h-[calc(100vh-300px)]">
        <h3 className="font-medium text-gray-800 mb-4">Popular Keyword Categories</h3>
        
        {Object.entries(topKeywordsByCategory).map(([subCategoryName, keywords]) => {
          if (!Array.isArray(keywords) || keywords.length === 0) return null;
          
          return (
            <FilterCategory key={`subcategory-${subCategoryName}`} title={subCategoryName}>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword: KeywordItem) => (
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
    </div>
  );
};