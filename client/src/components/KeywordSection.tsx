import React, { useState } from "react";
import { FilterCategory } from "./FilterCategory";
import { Filter } from "./Filter";
import { SelectedFilters } from "./SelectedFilters";
import { useFilters } from "../context/FilterContext";
import topKeywordsByCategory from "../assets/top_keywords_by_category.json";
import keywordCategories from "../assets/keyword-categories.json";
import { Gamepad2, Globe, Paintbrush, Search, X } from "lucide-react";
import SearchButton from "./SearchButton";

interface KeywordItem {
  id: number;
  name: string;
  category: string;
  "sub-category": string;
  game_count?: number;
}

type MainCategory = "Game Mechanics & Systems" | "Setting & World" | "Aesthetics & Style";

interface CategoryCard {
  id: MainCategory;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const KeywordSection: React.FC = () => {
  // Category for filter context
  const category = 'Keywords';
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | null>(null);
  const { searchGames, selectedFilters, isLoading, clearAllFilters } = useFilters();

  // Define the three main category cards
  const mainCategories: CategoryCard[] = [
    {
      id: "Game Mechanics & Systems",
      title: "Game Mechanics",
      description: "Gameplay elements, progression systems, and interactive mechanics",
      icon: <Gamepad2 className="h-6 w-6" />,
      color: "from-blue-500 to-cyan-600"
    },
    {
      id: "Setting & World",
      title: "Setting & World",
      description: "Time periods, locations, and thematic environments",
      icon: <Globe className="h-6 w-6" />,
      color: "from-emerald-500 to-teal-600"
    },
    {
      id: "Aesthetics & Style",
      title: "Aesthetics & Style",
      description: "Visual styles, artistic influences, and presentation",
      icon: <Paintbrush className="h-6 w-6" />,
      color: "from-purple-500 to-pink-600"
    }
  ];

  // Helper function to get subCategories based on the main category
  const getSubcategories = (mainCat: MainCategory) => {
    const categoryData = keywordCategories[mainCat];
    if (!categoryData) return [];
    
    // Filter out description key and return only the subcategory keys
    return Object.keys(categoryData).filter(key => key !== 'description');
  };
  
  // Get keywords for a specific subcategory
  const getKeywordsForSubcategory = (subCategoryName: string) => {
    // Safely access the property with index signature to avoid TypeScript error
    return (topKeywordsByCategory as Record<string, KeywordItem[]>)[subCategoryName] || [];
  };

  const handleSearch = () => {
    if (selectedFilters.length > 0) {
      searchGames();
    }
  };

  return (
    <div className="keyword-section w-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="keyword-section-header bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Game Keywords</h3>
            <p className="text-white/80 text-sm mt-1">Select keywords to find games matching your interests</p>
          </div>
          <div className="flex gap-2">
            <button 
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium flex items-center gap-1"
              onClick={clearAllFilters}
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
            
            <button 
              className="px-3 py-1.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded text-sm font-medium flex items-center gap-1"
              onClick={handleSearch}
              disabled={selectedFilters.length === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="selected-tags-container bg-gray-50 p-4 border-b border-gray-200">
        <div className="selected-tags-header mb-2">
          <h3 className="text-sm font-medium text-gray-700">Selected Tags:</h3>
        </div>
        <div className="selected-tags-wrapper">
          <SelectedFilters />
        </div>
      </div>

      <div className="p-4">
        {!selectedMainCategory ? (
          <>
            <h3 className="font-medium text-gray-800 mb-4">Choose a Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mainCategories.map((cat) => (
                <div 
                  key={cat.id}
                  className="cursor-pointer bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => setSelectedMainCategory(cat.id)}
                >
                  <div className={`bg-gradient-to-r ${cat.color} p-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{cat.title}</h4>
                      {cat.icon}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600">{cat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">{selectedMainCategory}</h3>
              <button 
                className="text-sm text-indigo-600 hover:text-indigo-800"
                onClick={() => setSelectedMainCategory(null)}
              >
                Back to Categories
              </button>
            </div>
            
            <div className="keyword-filters overflow-y-auto max-h-[calc(100vh-300px)]">
              {getSubcategories(selectedMainCategory).map((subCategoryName) => {
                const keywords = getKeywordsForSubcategory(subCategoryName);
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
          </>
        )}
      </div>
    </div>
  );
};