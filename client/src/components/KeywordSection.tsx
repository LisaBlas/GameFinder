import React, { useState, useRef } from "react";
import { Filter } from "./Filter";
import topKeywordsByCategory from "../assets/top_keywords_by_category.json";
import keywordCategories from "../assets/keyword-categories.json";
import {
  ChevronDown, ChevronRight, ArrowLeft, Cog, Globe, Palette,
  Sword, Mountain, Crosshair, Zap, Layers, TrendingUp, Flame, Gamepad2,
  Coins, Sparkles, Wand2, LayoutGrid, Target, Trophy, Dices, Brain,
  Clock, Map, Leaf, Scroll, Users, Cloud, Car, Film, Hash,
  Paintbrush, Eye, Wind, Volume2, BookOpen, type LucideIcon,
  X, Search,
} from "lucide-react";
import KeywordSearch from './KeywordSearch';
import Tooltip from "./Tooltip";
import { SelectedFilters } from './SelectedFilters';
import { useFilters } from '../context/FilterContext';

interface KeywordItem {
  id: number;
  name: string;
  category: string;
  "sub-category": string;
  game_count?: number;
}

type MainCategory = "Mechanics & Systems" | "Setting & World" | "Aesthetics & Style";

interface KeywordSectionProps {
  expanded: boolean;
  setActiveSection: (section: 'keywords' | 'results' | 'none') => void;
  filterSectionRef: React.RefObject<HTMLDivElement>;
  heroRef: React.RefObject<HTMLDivElement>;
}

export const KeywordSection: React.FC<KeywordSectionProps> = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const category = 'Keywords';
  const { clearAllFilters, searchGames, selectedFilters, isLoading } = useFilters();

  const handleDesktopSearch = async () => {
    await searchGames();
  };

  const handleDesktopClear = () => {
    clearAllFilters();
  };

  const mainCategoryOrder: MainCategory[] = ["Mechanics & Systems", "Setting & World", "Aesthetics & Style"];
  const [collapsedCategories, setCollapsedCategories] = useState<Set<MainCategory>>(new Set());
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  const toggleCategory = (cat: MainCategory) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const getCategoryIcon = (mainCat: MainCategory) => {
    if (mainCat === "Mechanics & Systems") return <Cog className="w-6 h-6 text-primary" />;
    if (mainCat === "Setting & World") return <Globe className="w-6 h-6 text-primary" />;
    return <Palette className="w-6 h-6 text-primary" />;
  };

  const getTotalKeywordCount = (mainCat: MainCategory): number =>
    getSubcategories(mainCat).filter(subCat => {
      const kws = getKeywordsForSubcategory(subCat);
      return Array.isArray(kws) && kws.length > 0;
    }).length;

  const subcategoryIconMap: Record<string, LucideIcon> = {
    "Combat Systems": Sword,
    "Combat Environments": Mountain,
    "Combat Styles": Crosshair,
    "Movement": Zap,
    "Structure": Layers,
    "Progression": TrendingUp,
    "Challenges": Flame,
    "Controls": Gamepad2,
    "Economy Value": Coins,
    "Game Features": Sparkles,
    "RPGs": Wand2,
    "Puzzles": LayoutGrid,
    "Shooters": Target,
    "Sports": Trophy,
    "Strategy": Dices,
    "Simulation": Brain,
    "Time Periods": Clock,
    "Locations": Map,
    "Environmental Features": Leaf,
    "Historical Events": Scroll,
    "Cultural Elements": Users,
    "Setting Conditions": Cloud,
    "Vehicles & Transportation": Car,
    "Entertainment Franchises": Film,
    "Internet Culture": Hash,
    "Art Styles": Paintbrush,
    "Visual Themes": Eye,
    "Atmosphere": Wind,
    "Sound Design": Volume2,
    "Narrative Tone": BookOpen,
  };

  const getSubcategoryIcon = (subCategory: string, className = "w-3.5 h-3.5 shrink-0") => {
    const Icon = subcategoryIconMap[subCategory] ?? Dices;
    return <Icon className={className} />;
  };

  const getSubcategories = (mainCat: MainCategory): string[] => {
    const categoryData = keywordCategories[mainCat];
    if (!categoryData) return [];
    return Object.keys(categoryData).filter(key => key !== 'description');
  };

  const getKeywordsForSubcategory = (subCategoryName: string): KeywordItem[] => {
    return (topKeywordsByCategory as Record<string, KeywordItem[]>)[subCategoryName] || [];
  };

  const getSubcategoryParent = (subCategoryName: string): MainCategory | undefined =>
    mainCategoryOrder.find(cat => getSubcategories(cat).includes(subCategoryName));

  return (
    <div className="keyword-section w-full transition-all duration-500 h-auto">
      {/* Search bar row with title */}
      <div className="w-full px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="shrink-0 text-2xl font-bold bg-gradient-to-r from-primary to-white bg-clip-text text-transparent">
            Gamefinder
          </h1>
          <div className="flex-1">
            <KeywordSearch inputRef={searchInputRef} onKeywordSelect={() => {}} />
          </div>
        </div>
      </div>

      {/* Desktop query builder bar */}
      <div className="hidden lg:flex items-center gap-3 px-6 py-3 border-b border-border">
        <div className="flex-1 min-w-0">
          {selectedFilters.length > 0 && <SelectedFilters />}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDesktopClear}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white border border-border bg-background hover:bg-red-500 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={handleDesktopSearch}
            disabled={selectedFilters.length === 0 || isLoading}
            className={`hero-button flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 ${
              selectedFilters.length > 0
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-primary/50 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

      {/* Main content */}
      <div className="p-6">
        {activeSubcategory ? (
          /* Keywords view — mirrors category card structure */
          (() => {
            const keywords = getKeywordsForSubcategory(activeSubcategory);
            const mainCat = getSubcategoryParent(activeSubcategory);
            const description = mainCat
              ? (keywordCategories[mainCat] as unknown as Record<string, { description: string }>)[activeSubcategory]?.description
              : "No description available.";
            return (
              <div>
                <button
                  onClick={() => setActiveSubcategory(null)}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to categories</span>
                </button>
                <div className="rounded-xl border border-border overflow-hidden">
                  {/* Subcategory header — same structure as category card header */}
                  <div className="flex items-start gap-4 p-5 bg-card">
                    <div className="shrink-0 mt-0.5 p-2.5 rounded-lg bg-primary/10">
                      {getSubcategoryIcon(activeSubcategory, "w-6 h-6 text-primary")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xl font-bold text-foreground">
                          {activeSubcategory}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary">
                          {keywords.length} keywords
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-snug">{description}</p>
                    </div>
                  </div>
                  {/* Keywords — same contained area style */}
                  <div className="border-t border-border bg-background/60 px-4 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {keywords.map((keyword: KeywordItem) => (
                        <Filter
                          key={keyword.id}
                          label={keyword.name}
                          id={keyword.id}
                          category={category}
                          onClick={() => {}}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          /* All categories — full-width vertical cards */
          <div className="space-y-4">
            {mainCategoryOrder.map((mainCat) => {
              const isCollapsed = collapsedCategories.has(mainCat);
              const subcategories = getSubcategories(mainCat);
              const totalKeywords = getTotalKeywordCount(mainCat);
              const descriptor = (keywordCategories[mainCat] as unknown as { description: string }).description;

              return (
                <div key={mainCat} className="rounded-xl border border-border overflow-hidden">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(mainCat)}
                    className="w-full flex items-start gap-4 p-5 text-left group bg-card hover:bg-primary/5 transition-colors"
                  >
                    <div className="shrink-0 mt-0.5 p-2.5 rounded-lg bg-primary/10">
                      {getCategoryIcon(mainCat)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {mainCat}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary">
                          {totalKeywords}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-snug">
                        {descriptor}
                      </p>
                    </div>
                    <div className="shrink-0 mt-1">
                      {isCollapsed
                        ? <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        : <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      }
                    </div>
                  </button>

                  {/* Subcategory container */}
                  {!isCollapsed && (
                    <div className="border-t border-border bg-background/60 px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {subcategories.map((subCategoryName) => {
                          const keywords = getKeywordsForSubcategory(subCategoryName);
                          if (!Array.isArray(keywords) || keywords.length === 0) return null;
                          const description = (keywordCategories[mainCat] as unknown as Record<string, { description: string }>)[subCategoryName]?.description || "";
                          return (
                            <Tooltip key={subCategoryName} content={description}>
                              <div
                                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium cursor-pointer transition-all duration-200 bg-card hover:bg-primary/10 border border-border hover:border-primary/50 whitespace-nowrap"
                                onClick={() => setActiveSubcategory(subCategoryName)}
                              >
                                {getSubcategoryIcon(subCategoryName)}
                                <span>{subCategoryName}</span>
                              </div>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
