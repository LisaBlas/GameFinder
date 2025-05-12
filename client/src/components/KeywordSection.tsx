import React, { useState, useEffect, useRef } from "react";
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
  setActiveSection: (section: 'keywords' | 'filters' | 'none') => void;
  filterSectionRef: React.RefObject<HTMLDivElement>;
}

export const KeywordSection: React.FC<KeywordSectionProps> = ({ expanded, setActiveSection, filterSectionRef }) => {
  const [hasAnimated, setHasAnimated] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Set hasAnimated to true after the initial animation
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 1000); // Match this with the animation duration
    
    return () => clearTimeout(timer);
  }, []);

  // Focus search input when section expands
  useEffect(() => {
    if (expanded && searchInputRef.current) {
      // Small delay to ensure the section is fully expanded
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [expanded]);

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
      // Scroll to filter section on mobile
      if (window.innerWidth < 1024) { // lg breakpoint
        filterSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 500); // Match this with the CSS animation duration
  };

  if (!expanded) {
    return (
      <div
        className={`
          keyword-section px-4 w-full bg-card rounded-lg overflow-hidden flex flex-col 
          hover:bg-muted/80 items-center justify-center text-center py-10 cursor-pointer 
          animate-[shadow-pulse_2s_ease-in-out_infinite]
          border-2 border-primary/20 animate-[border-pulse_2s_ease-in-out_infinite]
          min-h-[180px] transition-all duration-500
          ${!expanded ? 'lg:mt-auto lg:mb-auto' : ''}
        `}
        onClick={() => setActiveSection('keywords')}
        style={{ userSelect: 'none' }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center mb-2">
            <span className="text-4xl font-bold text-primary animate-pulse">1.</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-primary tracking-wide mb-1">
            Select A Keyword
          </h2>
          <p className="category-description text-base md:text-lg text-secondary-foreground/80 mb-2 max-w-xl mx-auto">
            By using the search bar or our curated categories.
          </p>
          <p className="text-sm text-primary/60 animate-pulse">Click to expand</p>
        </div>
      </div>
    );
  }

  return (
    <div className="keyword-section w-full bg-card rounded-lg overflow-hidden flex flex-col items-center justify-start text-center transition-all duration-500 lg:h-[calc(100vh-200px)] overflow-y-auto">
      {!selectedMainCategory && (
        <div className="w-full bg-primary/10 border-b border-primary/20 py-3">
          <div className="flex items-center justify-center gap-3 relative">
            <button 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary hover:text-primary/80 flex items-center"
              onClick={() => {
                // Add a class to trigger collapse animation
                const section = document.querySelector('.keyword-section');
                if (section) {
                  section.classList.add('collapsing');
                }
                
                // Wait for collapse animation to complete before collapsing
                setTimeout(() => {
                  setActiveSection('none');
                }, 500); // Match this with the CSS animation duration
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <span className="text-2xl font-bold text-primary">1.</span>
            <h2 className="text-xl font-extrabold text-primary tracking-wide">
              Select A Keyword
            </h2>
          </div>
        </div>
      )}

      {/* Add the search bar only when no category is selected */}
      {!selectedMainCategory && (
        <div className="w-full max-w-[500px] mx-auto px-4 mt-6">
          <KeywordSearch 
            inputRef={searchInputRef} 
            onKeywordSelect={() => {
              // Add a class to trigger collapse animation
              const section = document.querySelector('.keyword-section');
              if (section) {
                section.classList.add('collapsing');
              }
              
              // Wait for collapse animation to complete before switching sections
              setTimeout(() => {
                setActiveSection('filters');
                // Scroll to filter section on mobile
                if (window.innerWidth < 1024) { // lg breakpoint
                  filterSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
              }, 500); // Match this with the CSS animation duration
            }}
          />
        </div>
      )}

      <div className="w-full max-w-[500px] mx-auto flex flex-col gap-4">
        {!selectedMainCategory ? (
          <>
            <div className="gap-4 max-w-xl mx-auto">
              {mainCategories.map((cat, index) => (
                <div 
                  key={cat.id}
                  className={`cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${
                    selectedMainCategory && selectedMainCategory !== cat.id ? 'opacity-0 h-0 md:h-0 p-0 m-0 border-0 cursor-default' : 'category-enter'
                  } ${!selectedMainCategory ? 'main-category-container' : ''} ${
                    index === 2 ? 'col-span-2 md:col-span-1 md:col-start-2' : ''
                  }`}
                  onClick={() => setSelectedMainCategory(cat.id)}
                >
                  <div className={`p-6 flex flex-col items-center ${cat.color} border border-border ${cat.hoverColor} group transition-all duration-300 relative hover:shadow-[0_0_15px_rgba(124,58,237,0.15)]`}>
                    <div className="text-4xl mb-3 text-primary group-hover:text-primary/80 transition-colors">
                      {cat.icon}
                    </div>
                    <h4 className="font-semibold text-xl mb-2 text-foreground group-hover:text-primary transition-colors">{cat.title}</h4>
                    <p className="text-sm text-muted-foreground group-hover:text-foreground text-center transition-colors">{cat.description}</p>
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
                    const description = keywordCategories[selectedMainCategory as MainCategory]?.[activeSubcategory]?.description || "No description available.";
                    return (
                      <div key={`title-subcategory-${activeSubcategory}`} className="bg-primary/10 border-b border-primary/20 p-4 relative title-bar-change">
                        <button 
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary hover:text-primary/80 flex items-center"
                          onClick={() => setActiveSubcategory(null)}
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Back
                        </button>
                        <h3 className="font-medium text-primary text-center text-xl flex items-center justify-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-2xl">{emoji}</span>
                          {activeSubcategory}
                        </h3>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={`title-category-${cat.id}`} className="bg-primary/10 border-b border-primary/20 p-4 relative main-category-enter">
                      <button 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary hover:text-primary/80 flex items-center"
                        onClick={() => setSelectedMainCategory(null)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                      </button>
                      <h3 className="font-medium text-primary text-center text-xl flex items-center justify-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6">{cat.icon}</span>
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
                    const description = keywordCategories[selectedMainCategory as MainCategory]?.[subCategoryName]?.description || "No description available.";
                    
                    return (
                      <div key={`subcategory-content-${subCategoryName}`} className="mb-8">
                        <div className="bg-card/50 border border-border rounded-lg p-4 mb-4 subcategory-content-enter">
                          <p className="text-sm text-muted-foreground mb-4">{description}</p>
                          
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