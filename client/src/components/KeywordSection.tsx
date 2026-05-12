import React, { useEffect, useRef, useState } from "react";
import { Filter } from "./Filter";
import topKeywordsByCategory from "../assets/top_keywords_by_category.json";
import extendedKeywordsByCategory from "../assets/extended_keywords_by_category.json";
import keywordCategories from "../assets/keyword-categories.json";
import {
  Cog, Globe, Palette,
  Sword, Mountain, Crosshair, Zap, Layers, TrendingUp, Flame, Gamepad2,
  Coins, Sparkles, Wand2, LayoutGrid, Target, Trophy, Dices, Brain,
  Clock, Map, Leaf, Scroll, Users, Cloud, Car, Film, Hash,
  Paintbrush, Eye, Wind, Volume2, BookOpen, type LucideIcon,
  X, Search, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import KeywordSearch from './KeywordSearch';
import Tooltip from "./Tooltip";
import { SelectedFilters } from './SelectedFilters';
import { useFilters } from '../context/FilterContext';
import Navbar from './Navbar';

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

  const mainCategoryOrder: MainCategory[] = ["Mechanics & Systems", "Setting & World", "Aesthetics & Style"];
  const [activeMainCategory, setActiveMainCategory] = useState<MainCategory | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [mobileSubcategoryView, setMobileSubcategoryView] = useState(false);
  const [revealedExtended, setRevealedExtended] = useState<KeywordItem[]>([]);
  const [animBatchStart, setAnimBatchStart] = useState(0);
  const EXTENDED_PAGE_SIZE = 20;

  useEffect(() => {
    setRevealedExtended([]);
    setAnimBatchStart(0);
  }, [activeSubcategory]);

  const selectMainCategory = (cat: MainCategory) => {
    setActiveMainCategory(current => current === cat ? null : cat);
    setActiveSubcategory(null);
    setMobileSubcategoryView(false);
    setRevealedExtended([]);
    setAnimBatchStart(0);
  };

  const drillIntoSubcategory = (mainCat: MainCategory, subCategoryName: string) => {
    setActiveMainCategory(mainCat);
    setActiveSubcategory(subCategoryName);
    setMobileSubcategoryView(true);
    setRevealedExtended([]);
    setAnimBatchStart(0);
  };

  const getCategoryIcon = (mainCat: MainCategory) => {
    if (mainCat === "Mechanics & Systems") return <Cog className="w-5 h-5" />;
    if (mainCat === "Setting & World") return <Globe className="w-5 h-5" />;
    return <Palette className="w-5 h-5" />;
  };

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

  const getAvailableSubcategories = (mainCat: MainCategory): string[] =>
    getSubcategories(mainCat).filter(subCat => getKeywordsForSubcategory(subCat).length > 0);

  const getTotalKeywordCount = (mainCat: MainCategory): number =>
    getAvailableSubcategories(mainCat).length;

  const getSubcategoryDescription = (mainCat: MainCategory, subCategoryName: string): string =>
    (keywordCategories[mainCat] as unknown as Record<string, { description: string }>)[subCategoryName]?.description || "";

  const getSubcategoryParent = (subCategoryName: string): MainCategory | undefined =>
    mainCategoryOrder.find(cat => getSubcategories(cat).includes(subCategoryName));

  const getKeywordPanelData = (subCategoryName: string) => {
    const topKeywords = getKeywordsForSubcategory(subCategoryName);
    const extendedKeywords = getExtendedKeywordsForSubcategory(subCategoryName);
    const usedIds = new Set(revealedExtended.map(keyword => keyword.id));
    const unseenExtended = extendedKeywords.filter(keyword => !usedIds.has(keyword.id));
    const displayedKeywords = [...topKeywords, ...revealedExtended];
    const mainCat = getSubcategoryParent(subCategoryName);

    return {
      topKeywords,
      extendedKeywords,
      unseenExtended,
      displayedKeywords,
      totalKeywords: topKeywords.length + extendedKeywords.length,
      description: mainCat ? getSubcategoryDescription(mainCat, subCategoryName) : "",
      isModified: revealedExtended.length > 0,
      moreAvailable: unseenExtended.length,
    };
  };

  const revealMoreKeywords = (displayedCount: number, unseenExtended: KeywordItem[]) => {
    setAnimBatchStart(displayedCount);
    setRevealedExtended(prev => [...prev, ...unseenExtended.slice(0, EXTENDED_PAGE_SIZE)]);
  };

  const renderKeywordPill = (keyword: KeywordItem, index: number, batchStart = 0) => (
    <div
      key={keyword.id}
      className="keyword-inline-item"
      style={{ animationDelay: `${Math.min(Math.max(index - batchStart, 0) * 25, 400)}ms` }}
    >
      <Filter
        label={keyword.name.replace(/\b\w/g, c => c.toUpperCase())}
        id={keyword.id}
        category={category}
        onClick={() => {}}
      />
    </div>
  );

  const renderKeywordPanel = (subCategoryName: string, variant: "desktop" | "mobile") => {
    const { extendedKeywords, displayedKeywords, totalKeywords, description, moreAvailable, unseenExtended } = getKeywordPanelData(subCategoryName);

    return (
      <div className={variant === "desktop" ? "flex h-full min-h-0 flex-col" : "grid gap-3"}>
        {variant === "desktop" && (
          <div className="flex min-h-[6.5rem] items-center gap-4 border-b border-border bg-card p-5">
            <div className="shrink-0 p-2.5 rounded-lg bg-primary/10">
              {getSubcategoryIcon(subCategoryName, "w-5 h-5 text-primary")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xl font-bold text-foreground">
                  {subCategoryName}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary">
                  {displayedKeywords.length}{extendedKeywords.length > 0 ? ` of ${totalKeywords}` : ""} keywords
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-snug">{description}</p>
            </div>
            <Tooltip content={moreAvailable > 0 ? `Show ${Math.min(moreAvailable, EXTENDED_PAGE_SIZE)} more` : "No more keywords"}>
              <button
                onClick={() => revealMoreKeywords(displayedKeywords.length, unseenExtended)}
                disabled={moreAvailable === 0}
                className="shrink-0 flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                {moreAvailable > 0 ? `Show ${Math.min(moreAvailable, EXTENDED_PAGE_SIZE)} more` : "No more"}
              </button>
            </Tooltip>
          </div>
        )}

        <div className={variant === "desktop" ? "flex-1 overflow-y-auto px-4 py-4" : "pt-1"}>
          <div className="keyword-inline-list">
            {displayedKeywords.map((keyword, index) => renderKeywordPill(keyword, index, animBatchStart))}
          </div>
        </div>
      </div>
    );
  };

  const renderDesktopExplorer = () => {
    const openSubcategories = activeMainCategory ? getAvailableSubcategories(activeMainCategory) : [];
    const selectedSubcategory = activeSubcategory && openSubcategories.includes(activeSubcategory)
      ? activeSubcategory
      : openSubcategories[0];

    return (
      <div className="hidden flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-background/40 lg:grid lg:grid-cols-[minmax(15rem,0.72fr)_minmax(0,1.55fr)]">
        <div className="flex min-h-0 flex-col border-r border-border bg-card/45">
          <div className="flex min-h-[6.5rem] items-center border-b border-border px-4">
            <KeywordSearch inputRef={searchInputRef} onKeywordSelect={() => {}} />
          </div>
          <div className="flex-1 overflow-y-auto p-2.5">
            <div className="grid gap-3">
              {mainCategoryOrder.map((mainCat) => {
                const subcategories = getAvailableSubcategories(mainCat);
                const isOpen = activeMainCategory === mainCat;
                if (subcategories.length === 0) return null;

                return (
                  <section key={mainCat} className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => selectMainCategory(mainCat)}
                      aria-expanded={isOpen}
                      className={`flex min-h-[2.5rem] w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        isOpen
                          ? "bg-white/[0.035] text-foreground"
                          : "text-muted-foreground hover:bg-white/[0.025] hover:text-foreground"
                      }`}
                    >
                      <span className={`shrink-0 rounded-md p-1.5 ${isOpen ? "bg-background/45 text-muted-foreground" : "text-muted-foreground"}`}>
                        {getCategoryIcon(mainCat)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">{mainCat}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180 text-foreground" : "text-muted-foreground"}`} />
                    </button>

                    {isOpen && (
                      <div className="grid gap-1 pl-2 pt-1">
                        {subcategories.map((subCategoryName) => {
                          const keywords = getKeywordsForSubcategory(subCategoryName);
                          const isActive = selectedSubcategory === subCategoryName;
                          const description = getSubcategoryDescription(mainCat, subCategoryName);

                          return (
                            <Tooltip key={subCategoryName} content={description}>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMainCategory(mainCat);
                                  setActiveSubcategory(subCategoryName);
                                }}
                                className={`relative flex min-h-[2.65rem] w-full items-center gap-2.5 rounded-lg px-3 py-2 pl-4 text-left text-sm font-semibold transition-colors duration-200 ${
                                  isActive
                                    ? "bg-primary/15 text-foreground"
                                    : "bg-transparent text-muted-foreground hover:bg-white/[0.035] hover:text-foreground"
                                }`}
                              >
                                {isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />}
                                {getSubcategoryIcon(subCategoryName, `w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`)}
                                <span className="min-w-0 flex-1 truncate">{subCategoryName}</span>
                                <span className="shrink-0 text-xs font-medium text-muted-foreground/75">{keywords.length}</span>
                              </button>
                            </Tooltip>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        </div>

        <div className="min-h-0 min-w-0">
          {selectedSubcategory ? (
            renderKeywordPanel(selectedSubcategory, "desktop")
          ) : (
            <div className="flex h-full min-h-[18rem] items-center justify-center px-6 text-center">
              <div className="max-w-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card text-primary">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">Choose a category</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Open Mechanics, World, or Style to browse their subcategories.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMobileSubcategoryDetail = () => {
    if (!mobileSubcategoryView || !activeSubcategory) return null;
    const { displayedKeywords, description, extendedKeywords, totalKeywords, moreAvailable, unseenExtended } = getKeywordPanelData(activeSubcategory);

    return (
      <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            type="button"
            onClick={() => setMobileSubcategoryView(false)}
            className="shrink-0 flex items-center justify-center rounded-lg h-8 w-8 border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            aria-label="Back to categories"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="shrink-0 rounded-md bg-primary/10 p-1.5 text-primary">
            {getSubcategoryIcon(activeSubcategory, "w-4 h-4")}
          </span>
          <span className="font-bold text-foreground truncate flex-1">{activeSubcategory}</span>
          <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
            {displayedKeywords.length}{extendedKeywords.length > 0 ? ` of ${totalKeywords}` : ""}
          </span>
        </div>

        {description && (
          <div className="shrink-0 px-4 py-2.5 bg-background/40 border-b border-border/50">
            <p className="text-xs text-muted-foreground leading-snug">{description}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="keyword-inline-list">
            {displayedKeywords.map((keyword, index) => renderKeywordPill(keyword, index, animBatchStart))}
            {moreAvailable > 0 && (
              <div className="keyword-inline-item" style={{ animationDelay: `${Math.min(Math.max(displayedKeywords.length - animBatchStart, 0) * 25, 400)}ms` }}>
                <button
                  type="button"
                  onClick={() => revealMoreKeywords(displayedKeywords.length, unseenExtended)}
                  className="mb-2 inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 text-xs font-bold text-primary transition-colors hover:border-primary/50 hover:bg-primary/10"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show {Math.min(moreAvailable, EXTENDED_PAGE_SIZE)} more
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMobileShelves = () => {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden lg:hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-4">
            <KeywordSearch inputRef={searchInputRef} onKeywordSelect={() => {}} />
            {mainCategoryOrder.map((mainCat) => {
              const subcategories = getAvailableSubcategories(mainCat);
              const descriptor = (keywordCategories[mainCat] as unknown as { description: string }).description;
              const isOpen = activeMainCategory === mainCat;
              if (subcategories.length === 0) return null;

              return (
                <section
                  key={mainCat}
                  className={`rounded-xl border transition-colors ${
                    isOpen
                      ? "border-primary/35 bg-card/35 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                      : "border-border bg-card/25 p-3"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectMainCategory(mainCat)}
                    aria-expanded={isOpen}
                    className={`flex w-full items-start gap-3 rounded-lg border border-transparent text-left transition-colors ${
                      isOpen
                        ? "px-0 pb-3 pt-0 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5 p-2 rounded-lg bg-primary/15">
                      {getCategoryIcon(mainCat)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xl font-bold text-foreground">{mainCat}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-snug">{descriptor}</p>
                    </div>
                    <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180 text-primary" : ""}`} />
                  </button>

                  {isOpen && (
                    <div className="grid gap-3 border-t border-primary/25 pt-3">
                      {subcategories.map((subCategoryName) => {
                        const keywords = getKeywordsForSubcategory(subCategoryName);
                        const description = getSubcategoryDescription(mainCat, subCategoryName);

                        return (
                          <section key={subCategoryName} className="rounded-lg border border-border bg-card/70">
                            <button
                              type="button"
                              onClick={() => drillIntoSubcategory(mainCat, subCategoryName)}
                              className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
                            >
                              <span className="shrink-0 rounded-md bg-primary/10 p-1.5 text-primary">
                                {getSubcategoryIcon(subCategoryName, "w-4 h-4")}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                  <span className="font-bold text-foreground">{subCategoryName}</span>
                                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">{keywords.length}</span>
                                </span>
                                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{description}</span>
                              </span>
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </button>

                          </section>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const handleDesktopSearch = async () => {
    await searchGames();
  };

  const handleDesktopClear = () => {
    clearAllFilters();
  };

  return (
    <div className="keyword-section relative w-full h-full flex flex-col transition-all duration-500">
      {renderMobileSubcategoryDetail()}
      <Navbar />

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

      <div className="flex-1 min-h-0 p-3 lg:p-6">
        <div className="flex h-full min-h-0 flex-col gap-5">
          {renderDesktopExplorer()}
          {renderMobileShelves()}
        </div>
      </div>
    </div>
  );
};
