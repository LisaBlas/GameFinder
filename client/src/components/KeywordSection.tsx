import React, { useState, useRef } from "react";
import { Filter } from "./Filter";
import topKeywordsByCategory from "../assets/top_keywords_by_category.json";
import keywordCategories from "../assets/keyword-categories.json";
import { Gamepad2, Globe, Paintbrush, ArrowLeft } from "lucide-react";
import KeywordSearch from './KeywordSearch';
import Tooltip from "./Tooltip";

interface KeywordItem {
  id: number;
  name: string;
  category: string;
  "sub-category": string;
  game_count?: number;
}

type MainCategory = "Mechanics & Systems" | "Setting & World" | "Aesthetics & Style";

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
  setActiveSection: (section: 'keywords' | 'results' | 'none') => void;
  filterSectionRef: React.RefObject<HTMLDivElement>;
  heroRef: React.RefObject<HTMLDivElement>;
}

export const KeywordSection: React.FC<KeywordSectionProps> = ({ filterSectionRef }) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Category for filter context
  const category = 'Keywords';
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  // Define the three main category cards
  const mainCategories: CategoryCard[] = [
    {
      id: "Mechanics & Systems",
      title: "Mechanics & Systems",
      description: "Gameplay elements, progression systems, and interactive mechanics",
      icon: <Gamepad2 className="h-12 w-12" />,
      color: "bg-card hover:bg-card/80",
      hoverColor: "hover:border-primary/50"
    },
    {
      id: "Setting & World",
      title: "Setting & World",
      description: "Time periods, locations, and thematic environments",
      icon: <Globe className="h-12 w-12" />,
      color: "bg-card hover:bg-card/80",
      hoverColor: "hover:border-primary/50"
    },
    {
      id: "Aesthetics & Style",
      title: "Aesthetics & Style",
      description: "Visual styles, artistic influences, and presentation",
      icon: <Paintbrush className="h-12 w-12" />,
      color: "bg-card hover:bg-card/80",
      hoverColor: "hover:border-primary/50"
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
      // Mechanics & Systems subcategories
      "Combat Systems": "⚔️",
      "Combat Environments": "🌋",
      "Combat Styles": "🎯",
      "Movement": "🏃",
      "Structure": "🏗️",
      "Progression": "📈",
      "Challenges": "🔥",
      "Controls": "🎮",
      "Economy Value": "💰",
      "Game Features": "✨",
      "RPGs": "🧙",
      "Puzzles": "🧩",
      "Shooters": "🔫",
      "Sports": "⚽",
      "Strategy": "🎲",
      "Simulation": "🧠",
      
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

  // Add handler for keyword selection
  const handleKeywordClick = () => {
    // Scroll to results section
    if (window.innerWidth < 1024) { // lg breakpoint
      filterSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="keyword-section w-full bg-card rounded-lg overflow-hidden transition-all duration-500 h-auto">
      {/* Search Bar - always at top */}
      <div className="w-full px-6 py-4 bg-primary/5 border-b border-primary/20">
        <div className="max-w-2xl mx-auto">
          <KeywordSearch
            inputRef={searchInputRef}
            onKeywordSelect={() => {
              // Scroll to results section on mobile
              if (window.innerWidth < 1024) { // lg breakpoint
                filterSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />
        </div>
      </div>

      {/* Main content area - two column layout on desktop */}
      <div className="flex flex-col lg:flex-row">
        {/* Left sidebar - Navigation breadcrumb (desktop only) */}
        {(selectedMainCategory || activeSubcategory) && (
          <div className="hidden lg:block w-64 border-r border-border p-4 bg-primary/5">
            <div className="space-y-2">
              {/* Show selected category */}
              {selectedMainCategory && (
                <div
                  className="p-3 rounded-lg bg-primary/10 border border-primary/30 cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => {
                    setActiveSubcategory(null);
                    setSelectedMainCategory(null);
                  }}
                >
                  <div className="flex items-center gap-2 text-primary">
                    <span className="text-xl">
                      {mainCategories.find(cat => cat.id === selectedMainCategory)?.icon}
                    </span>
                    <span className="font-medium text-sm">{selectedMainCategory}</span>
                  </div>
                </div>
              )}

              {/* Show selected subcategory */}
              {activeSubcategory && (
                <div className="ml-4">
                  <div
                    className="p-3 rounded-lg bg-primary/20 border border-primary/50 cursor-pointer hover:bg-primary/30 transition-colors"
                    onClick={() => setActiveSubcategory(null)}
                  >
                    <div className="flex items-center gap-2 text-primary">
                      <span className="text-lg">{getSubcategoryEmoji(activeSubcategory)}</span>
                      <span className="font-medium text-sm">{activeSubcategory}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right content area */}
        <div className="flex-1 p-6">
          {!selectedMainCategory ? (
            // Initial state - show all categories
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {mainCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                  onClick={() => setSelectedMainCategory(cat.id)}
                >
                  <div className={`p-6 flex flex-col items-center ${cat.color} ${cat.hoverColor} group transition-all duration-300 hover:bg-primary`}>
                    <div className="text-4xl mb-3 text-primary group-hover:text-white transition-colors">
                      {cat.icon}
                    </div>
                    <h4 className="font-semibold text-xl mb-2 text-foreground group-hover:text-white transition-colors text-center">{cat.title}</h4>
                    <p className="text-sm text-muted-foreground group-hover:text-white text-center transition-colors">{cat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : !activeSubcategory ? (
            // Category selected - show subcategories
            <>
              {/* Mobile breadcrumb */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setSelectedMainCategory(null)}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{selectedMainCategory}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl">
                {getSubcategories(selectedMainCategory).map((subCategoryName) => {
                  const keywords = getKeywordsForSubcategory(subCategoryName);
                  if (!Array.isArray(keywords) || keywords.length === 0) return null;

                  const emoji = getSubcategoryEmoji(subCategoryName);
                  const description =
                    keywordCategories[selectedMainCategory as MainCategory]?.[subCategoryName]?.description || "No description available.";

                  return (
                    <Tooltip key={`tooltip-${subCategoryName}`} content={description}>
                      <div
                        key={`subcategory-${subCategoryName}`}
                        className="flex flex-col items-center rounded-lg p-4 text-sm font-medium cursor-pointer transition-all duration-200 bg-card hover:bg-primary/10 border border-border hover:border-primary/50"
                        onClick={() => setActiveSubcategory(subCategoryName)}
                      >
                        <span className="text-3xl mb-2">{emoji}</span>
                        <span className="text-center w-full line-clamp-2">{subCategoryName}</span>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </>
          ) : (
            // Subcategory selected - show keywords
            <>
              {/* Mobile breadcrumb */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setActiveSubcategory(null)}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{activeSubcategory}</span>
                </button>
              </div>

              <div className="max-w-4xl">
                {getSubcategories(selectedMainCategory)
                  .filter(subCategoryName => subCategoryName === activeSubcategory)
                  .map((subCategoryName) => {
                    const keywords = getKeywordsForSubcategory(subCategoryName);
                    if (!Array.isArray(keywords) || keywords.length === 0) return null;
                    const description = keywordCategories[selectedMainCategory as MainCategory]?.[subCategoryName]?.description || "No description available.";

                    return (
                      <div key={`subcategory-content-${subCategoryName}`}>
                        <p className="text-sm text-muted-foreground mb-4">{description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {keywords.map((keyword: KeywordItem) => (
                            <div key={`keyword-${keyword.id}`}>
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
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};