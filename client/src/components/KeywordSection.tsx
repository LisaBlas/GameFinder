import React, { useState } from "react";
import { FilterCategory } from "./FilterCategory";
import { Filter } from "./Filter";
import { SelectedFilters } from "./SelectedFilters";
import { useFilters } from "../context/FilterContext";
import topKeywordsByCategory from "../assets/top_keywords_by_category.json";
import keywordCategories from "../assets/keyword-categories.json";
import { Gamepad2, Globe, Paintbrush, Search, X, ArrowLeft } from "lucide-react";
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
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const { searchGames, selectedFilters, isLoading, clearAllFilters } = useFilters();

  // Define the three main category cards
  const mainCategories: CategoryCard[] = [
    {
      id: "Game Mechanics & Systems",
      title: "Game Mechanics",
      description: "Gameplay elements, progression systems, and interactive mechanics",
      icon: <Gamepad2 className="h-12 w-12" />,
      color: "from-blue-500 to-cyan-600"
    },
    {
      id: "Setting & World",
      title: "Setting & World",
      description: "Time periods, locations, and thematic environments",
      icon: <Globe className="h-12 w-12" />,
      color: "from-emerald-500 to-teal-600"
    },
    {
      id: "Aesthetics & Style",
      title: "Aesthetics & Style",
      description: "Visual styles, artistic influences, and presentation",
      icon: <Paintbrush className="h-12 w-12" />,
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
    <div className="keyword-section w-full bg-card rounded-lg shadow-md overflow-hidden border border-border">      
      <div className="p-4">
        {!selectedMainCategory ? (
          <>
            <div className="flex justify-end mb-4">
              <div className="flex gap-2">
                <button 
                  className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded text-sm font-medium flex items-center gap-1"
                  onClick={clearAllFilters}
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
                
                <button 
                  className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm font-medium flex items-center gap-1"
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mainCategories.map((cat) => (
                <div 
                  key={cat.id}
                  className={`cursor-pointer bg-muted/50 border border-border rounded-lg overflow-hidden shadow-md hover:shadow-lg hover:bg-muted transition-all duration-300 ${
                    selectedMainCategory && selectedMainCategory !== cat.id ? 'opacity-0 h-0 md:h-0 p-0 m-0 border-0 cursor-default' : ''
                  }`}
                  onClick={() => setSelectedMainCategory(cat.id)}
                >
                  <div className={`bg-gradient-to-r ${cat.color} p-6 text-white flex flex-col items-center`}>
                    <div className="text-4xl mb-3">
                      {cat.icon}
                    </div>
                    <h4 className="font-semibold text-xl mb-2">{cat.title}</h4>
                    <p className="text-sm text-white/90 text-center">{cat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* The buttons remain at the top, same as in non-expanded view */}
            <div className="flex justify-end mb-4">
              <div className="flex gap-2">
                <button 
                  className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded text-sm font-medium flex items-center gap-1"
                  onClick={clearAllFilters}
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
                
                <button 
                  className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm font-medium flex items-center gap-1"
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
            
            {/* Find the selected category to display its header with gradient */}
            {mainCategories
              .filter(cat => cat.id === selectedMainCategory)
              .map(cat => (
                <div key={`expanded-${cat.id}`} className="mb-6 rounded-lg overflow-hidden">
                  <div className={`bg-gradient-to-r ${cat.color} p-4 text-white relative`}>
                    <button 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white hover:text-white/80 flex items-center"
                      onClick={() => setSelectedMainCategory(null)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back
                    </button>
                    <h3 className="font-medium text-white text-center text-xl">{cat.title}</h3>
                  </div>
                </div>
              ))
            }
            
            <div className="mb-4">
              <h4 className="text-sm text-muted-foreground mb-2">Subcategories:</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {getSubcategories(selectedMainCategory).map((subCategoryName) => {
                  const keywords = getKeywordsForSubcategory(subCategoryName);
                  if (!Array.isArray(keywords) || keywords.length === 0) return null;
                  
                  const isActive = activeSubcategory === subCategoryName;
                  
                  return (
                    <div 
                      key={`subcategory-${subCategoryName}`}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium cursor-pointer transition-colors ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                      onClick={() => {
                        if (isActive) {
                          // If already active, deactivate it
                          setActiveSubcategory(null);
                        } else {
                          // Otherwise, set this as active
                          setActiveSubcategory(subCategoryName);
                        }
                      }}
                    >
                      {subCategoryName}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="keyword-filters overflow-y-auto max-h-[calc(100vh-300px)]">
              {getSubcategories(selectedMainCategory).map((subCategoryName) => {
                const keywords = getKeywordsForSubcategory(subCategoryName);
                if (!Array.isArray(keywords) || keywords.length === 0) return null;
                
                const isActive = activeSubcategory === subCategoryName;
                
                return (
                  <div key={subCategoryName} className="subcategory-group">
                    <div className="subcategory-header">
                      {subCategoryName.replace(/_/g, ' ')}
                    </div>
                    <div className="subcategory-content">
                      {keywords.map((keyword) => (
                        <div
                          key={keyword.id}
                          className={`keyword-filter ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            if (isActive) {
                              setActiveSubcategory(null);
                            } else {
                              setActiveSubcategory(subCategoryName);
                            }
                          }}
                        >
                          {keyword.name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
                const isVisible = activeSubcategory === subCategoryName;
                
                return (
                  <div 
                    key={`subcategory-content-${subCategoryName}`} 
                    className={`mb-4 transition-opacity duration-200 ${isVisible ? 'block opacity-100' : 'hidden opacity-0'}`}
                  >
                    <h4 className="text-sm font-medium text-foreground mb-2">{subCategoryName}</h4>
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
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};