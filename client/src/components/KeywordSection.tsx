import React, { useState } from "react";
import { FilterCategory } from "./FilterCategory";
import { Filter } from "./Filter";
import { SelectedFilters } from "./SelectedFilters";
import { useFilters } from "../context/FilterContext";
import topKeywordsByCategory from "../assets/top_keywords_by_category.json";
import keywordCategories from "../assets/keyword-categories.json";
import { Gamepad2, Globe, Paintbrush, Search, X, ArrowLeft, ChevronDown } from "lucide-react";
import SearchButton from "./SearchButton";
import Tooltip from "./Tooltip";
import KeywordSearch from './KeywordSearch';

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
  hoverColor: string;
}

interface KeywordSectionProps {
  expanded: boolean;
  setActiveSection: (section: 'keywords' | 'filters') => void;
}

export const KeywordSection: React.FC<KeywordSectionProps> = ({ expanded, setActiveSection }) => {
  // Category for filter context
  const category = 'Keywords';
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const { searchGames, selectedFilters, isLoading, clearAllFilters } = useFilters();

  // Define the three main category cards
  const mainCategories: CategoryCard[] = [
    {
      id: "Game Mechanics & Systems",
      title: "Game Mechanics & Systems",
      description: "Gameplay elements, progression systems, and interactive mechanics",
      icon: <Gamepad2 className="h-12 w-12" />,
      color: "from-blue-500 to-cyan-600",
      hoverColor: "hover:from-background hover:to-background"
    },
    {
      id: "Setting & World",
      title: "Setting & World",
      description: "Time periods, locations, and thematic environments",
      icon: <Globe className="h-12 w-12" />,
      color: "from-emerald-500 to-teal-600",
      hoverColor: "hover:from-background hover:to-background"
    },
    {
      id: "Aesthetics & Style",
      title: "Aesthetics & Style",
      description: "Visual styles, artistic influences, and presentation",
      icon: <Paintbrush className="h-12 w-12" />,
      color: "from-purple-500 to-pink-600",
      hoverColor: "hover:from-background hover:to-background"
    }
  ];

  // Helper function to get subCategories based on the main category
  const getSubcategories = (mainCat: MainCategory) => {
    const categoryData = keywordCategories[mainCat];
    if (!categoryData) return [];
    
    // Filter out description key and return only the subcategory keys
    return Object.keys(categoryData).filter(key => key !== 'description');
  };
  
  // Get emoji for subcategory
  const getSubcategoryEmoji = (subCategory: string): string => {
    // Match subcategories to appropriate emojis
    const emojiMap: Record<string, string> = {
      // Game Mechanics & Systems subcategories
      "Combat Systems": "⚔️",
      "Combat Environments": "🌋",
      "Combat Styles": "🎯",
      "Movement Types": "🏃",
      "Game Structure": "🏗️",
      "Player Progression": "📈",
      "Challenge Types": "🔥",
      "Control Schemes": "🎮",
      "Game Economy": "💰",
      "Game Features": "✨",
      "RPG Elements": "🧙",
      "Puzzle Types": "🧩",
      "Shooter Types": "🔫",
      "Sports Types": "⚽",
      "Strategy Types": "🎲",
      "Simulation Elements": "🧠",
      
      // Setting & World subcategories
      "Time Periods": "⏳",
      "Locations": "🗺️",
      "Environmental Features": "🌍",
      "Historical Events": "📜",
      "Cultural Elements": "👨‍👩‍👧‍👦",
      "Setting Conditions": "🌆",
      "Vehicles & Transportation": "🚗",
      "Entertainment Franchises": "🎬",
      "Internet Culture": "🌐",
      
      // Aesthetics & Style subcategories
      "Art Styles": "🎨",
      "Visual Themes": "🎭",
      "Atmosphere": "🌆",
      "Sound Design": "🔊",
      "Narrative Tone": "📚"
    };
    
    return emojiMap[subCategory] || "🎲"; // Default to dice emoji if not found
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

  // Add handler for keyword selection
  const handleKeywordClick = () => {
    // Add a class to trigger collapse animation
    const section = document.querySelector('.keyword-section');
    if (section) {
      section.classList.add('collapsing');
    }
    
    // Wait for collapse animation to complete before switching sections
    setTimeout(() => {
      setActiveSection('filters');
    }, 500); // Match this with the CSS animation duration
  };

  if (!expanded) {
    return (
      <div
        className="keyword-section w-full bg-card rounded-lg overflow-hidden flex flex-col hover:bg-muted/80 items-center justify-center text-center py-10 cursor-pointer min-h-[180px] transition-all duration-500"
        onClick={() => setActiveSection('keywords')}
        style={{ userSelect: 'none' }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center mb-2">
            <Gamepad2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-wide mb-1">
            Choose One Keyword
          </h2>
          <p className="text-base md:text-lg text-secondary-foreground/80 mb-2 max-w-xl mx-auto">
            Start your search by selecting gameplay mechanics, settings, or aesthetics that interest you. This helps us find games you'll love!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="keyword-section w-full bg-card rounded-lg overflow-hidden flex flex-col items-center justify-start text-center transition-all duration-500 h-[calc(100vh-200px)] overflow-y-auto">
      {!selectedMainCategory && (
        <div className="w-full bg-primary/10 border-b border-primary/20 py-3 px-4">
          <div className="flex items-center justify-center gap-3">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-extrabold text-primary tracking-wide">
              Choose One Keyword
            </h2>
          </div>
        </div>
      )}

      {/* Add the search bar only when no category is selected */}
      {!selectedMainCategory && (
        <div className="w-full max-w-[500px] mx-auto px-4 mt-6">
          <KeywordSearch />
        </div>
      )}

      <div className="w-full max-w-[500px] mx-auto flex flex-col gap-4">
        {!selectedMainCategory ? (
          <>
            <div className="gap-4 max-w-xl mx-auto">
              {mainCategories.map((cat, index) => (
                <div 
                  key={cat.id}
                  className={`cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${
                    selectedMainCategory && selectedMainCategory !== cat.id ? 'opacity-0 h-0 md:h-0 p-0 m-0 border-0 cursor-default' : 'category-enter'
                  } ${!selectedMainCategory ? 'main-category-container' : ''} ${
                    index === 2 ? 'col-span-2 md:col-span-1 md:col-start-2' : ''
                  }`}
                  onClick={() => setSelectedMainCategory(cat.id)}
                >
                  <div className={`p-6 flex flex-col items-center bg-gradient-to-r ${cat.color} ${cat.hoverColor} group transition-all duration-300 relative hover:border-2 hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]`}>
                    <div className="text-4xl mb-3 text-white group-hover:text-purple-500 transition-colors">
                      {cat.icon}
                    </div>
                    <h4 className="font-semibold text-xl mb-2 text-white group-hover:text-purple-500 transition-colors">{cat.title}</h4>
                    <p className="text-sm text-white/90 group-hover:text-white text-center transition-colors">{cat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 rounded-lg overflow-hidden">
              {mainCategories
                .filter(cat => cat.id === selectedMainCategory)
                .map(cat => {
                  const mainCat = mainCategories.find(c => c.id === selectedMainCategory);
                  const gradientClass = mainCat ? mainCat.color : '';
                  
                  if (activeSubcategory) {
                    const emoji = getSubcategoryEmoji(activeSubcategory);
                    return (
                      <div key={`title-subcategory-${activeSubcategory}`} className={`bg-gradient-to-r ${gradientClass} p-4 text-white relative title-bar-change`}>
                        <button 
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white hover:text-white/80 flex items-center"
                          onClick={() => setActiveSubcategory(null)}
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Back
                        </button>
                        <h3 className="font-medium text-white text-center text-xl">
                          <span className="inline-block mr-2 text-2xl">{emoji}</span>
                          {activeSubcategory}
                        </h3>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={`title-category-${cat.id}`} className={`bg-gradient-to-r ${cat.color} p-4 text-white relative main-category-enter`}>
                      <button 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white hover:text-white/80 flex items-center"
                        onClick={() => setSelectedMainCategory(null)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                      </button>
                      <h3 className="font-medium text-white text-center text-xl">
                        <span className="inline-block mr-2 text-2xl">{cat.icon}</span>
                        {cat.title}
                      </h3>
                    </div>
                  );
                })
              }
            </div>
            
            {!activeSubcategory ? (
              <div className="mb-6 category-enter max-w-xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 filter-grid-enter">
                  {getSubcategories(selectedMainCategory)
                    .map((subCategoryName) => {
                      const keywords = getKeywordsForSubcategory(subCategoryName);
                      if (!Array.isArray(keywords) || keywords.length === 0) return null;
                      
                      const emoji = getSubcategoryEmoji(subCategoryName);
                      const description =
                      keywordCategories[selectedMainCategory as MainCategory]?.[subCategoryName]?.description || "No description available.";
                      
                      return (
                        <Tooltip key={`tooltip-${subCategoryName}`} content={description}>
                          <div 
                            key={`subcategory-${subCategoryName}`}
                            className="subcategory-card flex flex-col items-center rounded-lg p-3 text-sm font-medium cursor-pointer transition-all duration-200 bg-card"
                            onClick={() => {
                              setActiveSubcategory(subCategoryName);
                            }}
                          >
                            <span className="emoji text-2xl mb-2">{emoji}</span>
                            <span className="text-center">{subCategoryName}</span>
                          </div>
                        </Tooltip>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="keyword-filters max-w-xl mx-auto">
                {getSubcategories(selectedMainCategory)
                  .filter(subCategoryName => subCategoryName === activeSubcategory)
                  .map((subCategoryName) => {
                    const keywords = getKeywordsForSubcategory(subCategoryName);
                    if (!Array.isArray(keywords) || keywords.length === 0) return null;
                    
                    return (
                      <div key={`subcategory-content-${subCategoryName}`} className="mb-8">
                        <div className="bg-card/50 border border-border rounded-lg p-4 mb-4 subcategory-content-enter">
                          <p className="text-sm text-muted-foreground mb-4">Select keywords below to refine your game search:</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 filter-grid-enter">
                            {keywords.map((keyword: KeywordItem) => (
                              <div key={`keyword-${keyword.id}`} className="filter-card">
                                <Filter
                                  key={keyword.id}
                                  label={keyword.name}
                                  id={keyword.id}
                                  category={category}
                                  onClick={handleKeywordClick}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};