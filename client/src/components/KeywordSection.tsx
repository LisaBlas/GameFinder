import React, { useState, useRef, useEffect } from "react";
import { Filter } from "./Filter";
import topKeywordsByCategory from "../assets/top_keywords_by_category.json";
import extendedKeywordsByCategory from "../assets/extended_keywords_by_category.json";
import keywordCategories from "../assets/keyword-categories.json";
import {
  ArrowLeft, Cog, Globe, Palette,
  Sword, Mountain, Crosshair, Zap, Layers, TrendingUp, Flame, Gamepad2,
  Coins, Sparkles, Wand2, LayoutGrid, Target, Trophy, Dices, Brain,
  Clock, Map, Leaf, Scroll, Users, Cloud, Car, Film, Hash,
  Paintbrush, Eye, Wind, Volume2, BookOpen, type LucideIcon,
  X, Search, ChevronDown, RotateCcw,
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
  const hasSearchableFilters = selectedFilters.some(filter => filter.mode !== "exclude");

  const handleDesktopSearch = async () => {
    await searchGames();
  };

  const handleDesktopClear = () => {
    clearAllFilters();
  };

  const mainCategoryOrder: MainCategory[] = ["Mechanics & Systems", "Setting & World", "Aesthetics & Style"];
  const [activeMainCategory, setActiveMainCategory] = useState<MainCategory>("Mechanics & Systems");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const EXTENDED_PAGE_SIZE = 20;
  const [revealedExtended, setRevealedExtended] = useState<KeywordItem[]>([]);
  const [animBatchStart, setAnimBatchStart] = useState(0);

  useEffect(() => {
    setRevealedExtended([]);
    setAnimBatchStart(0);
  }, [activeSubcategory]);

  const selectMainCategory = (cat: MainCategory) => {
    setActiveMainCategory(cat);
    setActiveSubcategory(null);
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

  const getExtendedKeywordsForSubcategory = (subCategoryName: string): KeywordItem[] => {
    return (extendedKeywordsByCategory as Record<string, KeywordItem[]>)[subCategoryName] || [];
  };

  const getSubcategoryParent = (subCategoryName: string): MainCategory | undefined =>
    mainCategoryOrder.find(cat => getSubcategories(cat).includes(subCategoryName));

  const getCategoryShortLabel = (mainCat: MainCategory) => {
    if (mainCat === "Mechanics & Systems") return "Mechanics";
    if (mainCat === "Setting & World") return "World";
    return "Style";
  };

  const renderCategorySelector = () => (
    <div className="grid grid-cols-3 gap-2">
      {mainCategoryOrder.map((mainCat) => {
        const isActive = activeMainCategory === mainCat;

        return (
          <button
            key={mainCat}
            onClick={() => selectMainCategory(mainCat)}
            className={`group flex min-w-0 rounded-lg border transition-all duration-200
              flex-col items-center justify-center gap-1 px-2 py-3 text-center
              lg:flex-row lg:items-center lg:gap-2 lg:px-3 lg:text-left
              ${isActive
                ? "border-primary/70 bg-primary/15 text-foreground shadow-[0_0_22px_rgba(16,185,129,0.12)]"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              }`}
          >
            <span className={`shrink-0 rounded-md p-1.5 ${isActive ? "bg-primary/15" : "bg-background/50 group-hover:bg-primary/10"}`}>
              {getCategoryIcon(mainCat)}
            </span>
            <span className="min-w-0 lg:flex-1">
              <span className="block text-sm font-bold">
                {getCategoryShortLabel(mainCat)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="keyword-section w-full h-full flex flex-col transition-all duration-500">
      {/* Desktop-only: title + tagline sticky header */}
      <div className="hidden lg:flex flex-col justify-center sticky top-0 z-30 min-h-[4.75rem] border-b border-border bg-[rgba(5,16,12,0.94)] backdrop-blur-[14px] shadow-[0_12px_28px_rgba(0,0,0,0.24)] w-full px-6">
        <div className="flex items-baseline gap-3">
          <h1 className="shrink-0 text-2xl font-bold bg-gradient-to-r from-primary to-white bg-clip-text text-transparent">
            Gamefinder
          </h1>
          <span className="text-sm text-muted-foreground">Find your next favourite game</span>
        </div>
      </div>

      {/* Desktop query builder bar */}
      <div className="desktop-action-bar hidden lg:grid border-b border-border">
        <div className="user-selection">
          <SelectedFilters variant="lanes" />
        </div>
        <div className="desktop-action-buttons">
          <button
            onClick={handleDesktopClear}
            className="desktop-action-button desktop-action-button-clear"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={handleDesktopSearch}
            disabled={!hasSearchableFilters || isLoading}
            className={`hero-button desktop-action-button desktop-action-button-search ${
              hasSearchableFilters
                ? 'desktop-action-button-search-active'
                : 'desktop-action-button-search-disabled'
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
      <div className="flex-1 min-h-0 p-6">
        <div className="flex h-full min-h-0 flex-col gap-5">
          <KeywordSearch inputRef={searchInputRef} onKeywordSelect={() => {}} />
          {renderCategorySelector()}

          {activeSubcategory ? (
          /* Keywords view */
          (() => {
            const topKeywords = getKeywordsForSubcategory(activeSubcategory);
            const extendedKeywords = getExtendedKeywordsForSubcategory(activeSubcategory);
            const usedIds = new Set(revealedExtended.map(k => k.id));
            const unseenExtended = extendedKeywords.filter(k => !usedIds.has(k.id));
            const displayedKeywords = [...topKeywords, ...revealedExtended];
            const totalKeywords = topKeywords.length + extendedKeywords.length;
            const isModified = revealedExtended.length > 0;

            const mainCat = getSubcategoryParent(activeSubcategory);
            const description = mainCat
              ? (keywordCategories[mainCat] as unknown as Record<string, { description: string }>)[activeSubcategory]?.description
              : "No description available.";

            const handleShowMore = () => {
              const next = unseenExtended.slice(0, EXTENDED_PAGE_SIZE);
              setAnimBatchStart(displayedKeywords.length);
              setRevealedExtended(prev => [...prev, ...next]);
            };

            const handleRestore = () => {
              setRevealedExtended([]);
              setAnimBatchStart(0);
            };

            const moreAvailable = unseenExtended.length;

            return (
              <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-background/40">
                  {/* Subcategory header */}
                  <div className="relative flex items-center gap-4 border-b border-border bg-card p-5">
                    <button
                      onClick={() => setActiveSubcategory(null)}
                      aria-label={`Back to ${getCategoryShortLabel(mainCat ?? activeMainCategory)}`}
                      className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/50 text-primary transition-colors hover:border-primary/50 hover:bg-primary/10"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="shrink-0 p-2.5 rounded-lg bg-primary/10">
                      {getSubcategoryIcon(activeSubcategory, "w-6 h-6 text-primary")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xl font-bold text-foreground">
                          {activeSubcategory}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary">
                          {displayedKeywords.length}{extendedKeywords.length > 0 ? ` of ${totalKeywords}` : ""} keywords
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-snug">{description}</p>
                    </div>
                    {/* Action buttons: inline on mobile, straddling the border on desktop */}
                    <div className="shrink-0 flex items-center gap-1.5 lg:absolute lg:bottom-0 lg:right-4 lg:translate-y-1/2 lg:z-10 lg:bg-card lg:px-1">
                      <Tooltip content={isModified ? "Restore initial list" : "Nothing to restore"}>
                        <button
                          onClick={handleRestore}
                          disabled={!isModified}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content={moreAvailable > 0 ? `Show ${Math.min(moreAvailable, EXTENDED_PAGE_SIZE)} more` : "No more keywords"}>
                        <button
                          onClick={handleShowMore}
                          disabled={moreAvailable === 0}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  {/* Keywords */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="keyword-inline-list">
                      {displayedKeywords.map((keyword: KeywordItem, i) => (
                        <div
                          key={keyword.id}
                          className="keyword-inline-item"
                          style={{ animationDelay: `${Math.min(Math.max(i - animBatchStart, 0) * 25, 400)}ms` }}
                        >
                          <Filter
                            label={keyword.name.replace(/\b\w/g, c => c.toUpperCase())}
                            id={keyword.id}
                            category={category}
                            onClick={() => {}}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
              </div>
            );
          })()
        ) : (
          /* All categories — full-width vertical cards */
          <>
            {(() => {
              const subcategories = getSubcategories(activeMainCategory);
              const descriptor = (keywordCategories[activeMainCategory] as unknown as { description: string }).description;
              const totalKeywords = getTotalKeywordCount(activeMainCategory);

              return (
                <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-background/40">
                  <div className="flex items-start gap-4 border-b border-border bg-card p-5">
                    <div className="shrink-0 mt-0.5 p-2.5 rounded-lg bg-primary/10">
                      {getCategoryIcon(activeMainCategory)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xl font-bold text-foreground">
                          {activeMainCategory}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary">
                          {totalKeywords}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-snug">
                        {descriptor}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {subcategories.map((subCategoryName) => {
                        const keywords = getKeywordsForSubcategory(subCategoryName);
                        if (!Array.isArray(keywords) || keywords.length === 0) return null;
                        const description = (keywordCategories[activeMainCategory] as unknown as Record<string, { description: string }>)[subCategoryName]?.description || "";
                        return (
                          <Tooltip key={subCategoryName} content={description}>
                            <div
                              className="flex min-h-[3.25rem] items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium cursor-pointer transition-all duration-200 bg-card hover:bg-primary/10 border border-border hover:border-primary/50"
                              onClick={() => setActiveSubcategory(subCategoryName)}
                            >
                              {getSubcategoryIcon(subCategoryName, "w-4 h-4 shrink-0 text-primary")}
                              <span className="min-w-0 flex-1 leading-snug">{subCategoryName}</span>
                              <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                                {keywords.length}
                              </span>
                            </div>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
        </div>
      </div>
    </div>
  );
};
