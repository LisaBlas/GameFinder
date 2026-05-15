import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  X, Search, Share2, Check, ChevronDown, ChevronLeft, ChevronRight,
  Shuffle,
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
type UtilityPanel = "intro" | "qs-keyword" | "qs-combo";

interface KeywordComboSuggestion {
  title: string;
  filters: Array<{
    id: number;
    name: string;
    category: string;
    mode?: "include" | "exclude";
  }>;
}

interface KeywordSectionProps {
  expanded: boolean;
  setActiveSection: (section: 'keywords' | 'results' | 'none') => void;
  filterSectionRef: React.RefObject<HTMLDivElement>;
  heroRef: React.RefObject<HTMLDivElement>;
}

export const KeywordSection: React.FC<KeywordSectionProps> = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const category = 'Keywords';
  const { addFilter, clearAllFilters, removeFilter, searchGames, selectedFilters, isLoading, searchFresh } = useFilters();
  const hasSearchableFilters = selectedFilters.some(filter => filter.mode !== "exclude");
  const [shareCopied, setShareCopied] = useState(false);
  const [shareShineActive, setShareShineActive] = useState(false);

  const mainCategoryOrder: MainCategory[] = ["Mechanics & Systems", "Setting & World", "Aesthetics & Style"];
  const [activeMainCategory, setActiveMainCategory] = useState<MainCategory | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeUtilityPanel, setActiveUtilityPanel] = useState<UtilityPanel>("intro");
  const [mobileCategoryView, setMobileCategoryView] = useState(false);
  const [mobileSubcategoryView, setMobileSubcategoryView] = useState(false);
  const [revealedExtended, setRevealedExtended] = useState<KeywordItem[]>([]);
  const [animBatchStart, setAnimBatchStart] = useState(0);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [activeQsKeywordIndex, setActiveQsKeywordIndex] = useState(0);
  const EXTENDED_PAGE_SIZE = 20;

  const keywordComboSuggestions: KeywordComboSuggestion[] = [
    {
      title: "Poker Roguelike",
      filters: [
        { id: 154, name: "Poker", category },
        { id: 27419, name: "Roguelike Deckbuilder", category },
        { id: 35, name: "Card & Board Game", category: "genres" },
      ],
    },
    {
      title: "Storm City Roguelite",
      filters: [
        { id: 3533, name: "City Builder", category },
        { id: 17292, name: "Roguelite", category },
        { id: 606, name: "Resource Management", category },
      ],
    },
    {
      title: "Cozy Horror Fishing",
      filters: [
        { id: 509, name: "Fishing", category },
        { id: 2379, name: "Cosmic Horror", category },
        { id: 72, name: "Exploration", category },
      ],
    },
    {
      title: "Sushi Dive Management",
      filters: [
        { id: 509, name: "Fishing", category },
        { id: 38859, name: "Restaurant Management", category },
        { id: 138, name: "Underwater", category },
      ],
    },
    {
      title: "Cult Base Roguelike",
      filters: [
        { id: 2498, name: "Cult", category },
        { id: 41781, name: "Action Roguelike", category },
        { id: 1905, name: "Base Building", category },
      ],
    },
    {
      title: "Roadtrip Survival",
      filters: [
        { id: 778, name: "Driving", category },
        { id: 21, name: "Survival", category: "themes" },
        { id: 1, name: "First person", category: "Perspective" },
      ],
    },
    {
      title: "Card-Based FPS Parkour",
      filters: [
        { id: 4214, name: "Card Based Combat", category },
        { id: 453, name: "First Person Shooter", category },
        { id: 390, name: "Parkour", category },
      ],
    },
    {
      title: "Side-Scroll Souls",
      filters: [
        { id: 288, name: "2D", category },
        { id: 17326, name: "Souls-like", category },
        { id: 78, name: "Anime", category, mode: "exclude" },
      ],
    },
    {
      title: "Cozy Indie Hangout",
      filters: [
        { id: 24685, name: "Cozy", category },
        { id: 2084, name: "Relaxing", category },
        { id: 2, name: "Multiplayer", category: "Game Mode" },
        { id: 32, name: "Indie", category: "genres" },
      ],
    },
  ];

  const quickStartKeywords = [
    { id: 21,    name: "Survival",     emoji: "☄️", category: "themes" },
    { id: 24685, name: "Cozy",         emoji: "🌿", category },
    { id: 17292, name: "Roguelite",    emoji: "🎲", category },
    { id: 17326, name: "Souls-like",   emoji: "⚔️", category },
    { id: 2379,  name: "Cosmic Horror",emoji: "🌌", category },
    { id: 3533,  name: "City Builder", emoji: "🏙️", category },
  ];

  useEffect(() => {
    setRevealedExtended([]);
    setAnimBatchStart(0);
  }, [activeSubcategory]);

  useEffect(() => {
    let shineStart: ReturnType<typeof setTimeout> | undefined;
    let shineEnd: ReturnType<typeof setTimeout> | undefined;

    setShareShineActive(false);

    if (searchFresh && !isLoading) {
      shineStart = setTimeout(() => setShareShineActive(true), 500);
      shineEnd = setTimeout(() => setShareShineActive(false), 2100);
    }

    return () => {
      if (shineStart) clearTimeout(shineStart);
      if (shineEnd) clearTimeout(shineEnd);
    };
  }, [searchFresh, isLoading]);

  const selectMainCategory = (cat: MainCategory) => {
    setActiveMainCategory(current => current === cat ? null : cat);
    setActiveSubcategory(null);
    setActiveUtilityPanel("intro");
    setMobileCategoryView(false);
    setMobileSubcategoryView(false);
    setRevealedExtended([]);
    setAnimBatchStart(0);
  };

  const drillIntoCategory = (cat: MainCategory) => {
    setActiveMainCategory(cat);
    setActiveSubcategory(null);
    setMobileCategoryView(true);
    setMobileSubcategoryView(false);
    setRevealedExtended([]);
    setAnimBatchStart(0);
  };

  const drillIntoSubcategory = (mainCat: MainCategory, subCategoryName: string) => {
    setActiveMainCategory(mainCat);
    setActiveSubcategory(subCategoryName);
    setActiveUtilityPanel("intro");
    setMobileCategoryView(true);
    setMobileSubcategoryView(true);
    setRevealedExtended([]);
    setAnimBatchStart(0);
  };

  const getCategoryIcon = (mainCat: MainCategory, size = "w-5 h-5") => {
    if (mainCat === "Mechanics & Systems") return <Cog className={size} />;
    if (mainCat === "Setting & World") return <Globe className={size} />;
    return <Palette className={size} />;
  };

  const getCategoryAccentVars = (mainCat: MainCategory): React.CSSProperties => {
    if (mainCat === "Setting & World") return {
      '--cat-accent-rgb': 'var(--c-gold-rgb)',
      '--cat-accent-soft': 'var(--c-gold)',
    } as React.CSSProperties;
    if (mainCat === "Aesthetics & Style") return {
      '--cat-accent-rgb': 'var(--c-violet-rgb)',
      '--cat-accent-soft': 'var(--c-violet-soft)',
    } as React.CSSProperties;
    return {
      '--cat-accent-rgb': 'var(--c-cyan-rgb)',
      '--cat-accent-soft': 'var(--c-cyan-soft)',
    } as React.CSSProperties;
  };

  const getCategoryPreviewKeywords = (mainCat: MainCategory): string[] => ({
    "Mechanics & Systems": ["Bullet Hell", "Roguelike Deckbuilder", "Base Building", "Card-Based Combat"],
    "Setting & World": ["Cosmic Horror", "Underwater", "Post-Apocalyptic", "Viking Age"],
    "Aesthetics & Style": ["Cel-Shaded", "Voxel Art", "Minimalist UI", "Chiptune"],
  }[mainCat] ?? []);

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

  const applySuggestion = (suggestion: KeywordComboSuggestion) => {
    selectedFilters
      .filter(filter => filter.category === category)
      .forEach(filter => removeFilter(filter.id, filter.category, filter.endpoint));

    suggestion.filters.forEach(filter => {
      addFilter({
        id: filter.id,
        name: filter.name.replace(/\b\w/g, c => c.toUpperCase()),
        category: filter.category,
        mode: filter.category === category ? filter.mode || "include" : undefined,
      });
    });
  };

  const renderComboFilter = (filter: KeywordComboSuggestion["filters"][number]) => {
    const selectedFilter = selectedFilters.find(
      selected => selected.id === filter.id && selected.category === filter.category
    );
    const isExclude = filter.category === category && filter.mode === "exclude";
    const isSelected = selectedFilter && (
      isExclude ? selectedFilter.mode === "exclude" : selectedFilter.mode !== "exclude"
    );
    const label = filter.name.replace(/\b\w/g, c => c.toUpperCase());

    return (
      <button
        key={`${filter.category}-${filter.id}-${filter.mode || "include"}`}
        type="button"
        className={`filter-pill${isSelected ? " selected" : ""}${filter.category === category && isSelected ? ` keyword-${filter.mode || "include"}` : ""}`}
        onClick={() => {
          if (isSelected) {
            removeFilter(filter.id, filter.category);
            return;
          }

          addFilter({
            id: filter.id,
            name: filter.name.replace(/\b\w/g, c => c.toUpperCase()),
            category: filter.category,
            mode: filter.category === category ? filter.mode || "include" : undefined,
          });
        }}
      >
        <span>{label}</span>
      </button>
    );
  };

  const renderKeywordSuggestion = (variant: "desktop" | "mobile" = "desktop") => {
    const suggestion = keywordComboSuggestions[activeSuggestionIndex];

    return (
      <div className={`keyword-combo-empty-state ${variant === "mobile" ? "keyword-combo-mobile-state" : ""}`}>
        <div className="keyword-combo-card">
          <div className="keyword-combo-main">
            <div className="keyword-combo-copy">
              <h3>{suggestion.title}</h3>
            </div>
            <div className="keyword-combo-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              Hand-picked
            </div>
          </div>
          <div className="keyword-combo-recipe" aria-label={`${suggestion.title} filter combination`}>
            {suggestion.filters.map((filter, index) => (
              <React.Fragment key={`${filter.category}-${filter.id}-${filter.mode || "include"}`}>
                <span className={`keyword-combo-operator${filter.mode === "exclude" ? " exclude" : ""}`}>
                  {filter.mode === "exclude" ? "-" : "+"}
                </span>
                {renderComboFilter(filter)}
              </React.Fragment>
            ))}
          </div>
          <div className="keyword-combo-actions">
            <button
              type="button"
              className="keyword-combo-button keyword-combo-button-primary"
              onClick={() => applySuggestion(suggestion)}
            >
              <Check className="h-4 w-4" />
              Try combo
            </button>
            <button
              type="button"
              className="keyword-combo-button keyword-combo-button-secondary"
              onClick={() => setActiveSuggestionIndex(index => (index + 1) % keywordComboSuggestions.length)}
            >
              <Shuffle className="h-4 w-4" />
              Next
              <span className="keyword-combo-button-count">
                {activeSuggestionIndex + 1}/{keywordComboSuggestions.length}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderKeywordIntro = () => (
    <div className="keyword-intro-empty-state">
      <div className="keyword-intro-card">
        <div className="keyword-intro-icon">
          <LayoutGrid className="h-5 w-5" />
        </div>
        <div>
          <h3>Find a unique keyword</h3>
          <p>
            Explore 5000+ keywords. Combine, exclude and match to find hidden gems.
          </p>
        </div>
      </div>
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

  const renderQsKeywordPanel = () => {
    const kw = quickStartKeywords[activeQsKeywordIndex];
    return (
      <div className="qs-keyword-panel">
        <div className="qs-keyword-card">
          <p className="qs-keyword-sublabel">Featured keyword</p>
          <div className="qs-keyword-pill">
            <span className="qs-keyword-pill-emoji">{kw.emoji}</span>
            <span>{kw.name}</span>
          </div>
          <div className="qs-keyword-actions">
            <button
              type="button"
              className="qs-keyword-explore-btn"
              onClick={() => {
                addFilter({
                  id: kw.id,
                  name: kw.name.replace(/\b\w/g, c => c.toUpperCase()),
                  category: kw.category,
                  mode: "include",
                });
              }}
            >
              Explore
            </button>
            <button
              type="button"
              className="qs-keyword-shuffle-btn"
              onClick={() => setActiveQsKeywordIndex(i => (i + 1) % quickStartKeywords.length)}
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderQsComboPanel = () => {
    const suggestion = keywordComboSuggestions[activeSuggestionIndex];
    return (
      <div className="qs-combo-panel">
        <div className="qs-combo-card">
          <div className="qs-combo-header">
            <h3 className="qs-combo-title">{suggestion.title}</h3>
            <span className="qs-combo-kicker">
              <Sparkles className="h-3 w-3" />
              Hand-picked
            </span>
          </div>
          <div className="qs-combo-recipe">
            {suggestion.filters.map((filter) => (
              <React.Fragment key={`${filter.category}-${filter.id}-${filter.mode || "include"}`}>
                <span className={`qs-combo-operator${filter.mode === "exclude" ? " exclude" : ""}`}>
                  {filter.mode === "exclude" ? "−" : "+"}
                </span>
                {renderComboFilter(filter)}
              </React.Fragment>
            ))}
          </div>
          <div className="qs-combo-actions">
            <button
              type="button"
              className="qs-combo-btn-primary"
              onClick={() => applySuggestion(suggestion)}
            >
              <Check className="h-4 w-4" />
              Try combo
            </button>
            <button
              type="button"
              className="qs-combo-btn-secondary"
              onClick={() => setActiveSuggestionIndex(i => (i + 1) % keywordComboSuggestions.length)}
            >
              <Shuffle className="h-4 w-4" />
              Next
              <span className="qs-combo-count">
                {activeSuggestionIndex + 1}/{keywordComboSuggestions.length}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDesktopExplorer = () => {
    const openSubcategories = activeMainCategory ? getAvailableSubcategories(activeMainCategory) : [];
    const selectedSubcategory = (activeUtilityPanel === "qs-combo" || activeUtilityPanel === "qs-keyword")
      ? undefined
      : activeSubcategory && openSubcategories.includes(activeSubcategory)
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

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key={mainCat}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
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
                                      setActiveUtilityPanel("intro");
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                );
              })}

              <section className="grid gap-2 border-t border-border/70 pt-3">
                <div className="qs-section-label">
                  <Wand2 className="w-3 h-3" />
                  Quick Start
                </div>
                <div className="qs-cards-grid">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveUtilityPanel(current => current === "qs-keyword" ? "intro" : "qs-keyword");
                      setActiveMainCategory(null);
                      setActiveSubcategory(null);
                    }}
                    className={`qs-card${activeUtilityPanel === "qs-keyword" ? " active" : ""}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Try a Keyword</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveUtilityPanel(current => current === "qs-combo" ? "intro" : "qs-combo");
                      setActiveMainCategory(null);
                      setActiveSubcategory(null);
                    }}
                    className={`qs-card${activeUtilityPanel === "qs-combo" ? " active" : ""}`}
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Try a Combo</span>
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="min-h-0 min-w-0">
          <AnimatePresence mode="wait">
            {selectedSubcategory ? (
              <motion.div
                key={selectedSubcategory}
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {renderKeywordPanel(selectedSubcategory, "desktop")}
              </motion.div>
            ) : activeUtilityPanel === "qs-combo" ? (
              <motion.div
                key="qs-combo-panel"
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {renderQsComboPanel()}
              </motion.div>
            ) : activeUtilityPanel === "qs-keyword" ? (
              <motion.div
                key="qs-keyword-panel"
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {renderQsKeywordPanel()}
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {renderKeywordIntro()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderMobileSubcategoryDetail = () => {
    if (!mobileSubcategoryView || !activeSubcategory) return null;
    const { displayedKeywords, description, extendedKeywords, totalKeywords, moreAvailable, unseenExtended } = getKeywordPanelData(activeSubcategory);

    return (
      <motion.div
        key={activeSubcategory}
        className="lg:hidden fixed inset-0 z-[60] flex flex-col bg-background overflow-hidden"
        style={activeMainCategory ? getCategoryAccentVars(activeMainCategory) : {}}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            type="button"
            onClick={() => setMobileSubcategoryView(false)}
            className="shrink-0 flex items-center justify-center rounded-lg h-8 w-8 border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            aria-label="Back to categories"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span
            className="shrink-0 rounded-md p-1.5"
            style={{ background: 'rgba(var(--cat-accent-rgb), 0.1)', color: 'var(--cat-accent-soft)' }}
          >
            {getSubcategoryIcon(activeSubcategory, "w-4 h-4")}
          </span>
          <span className="font-bold text-foreground truncate flex-1">{activeSubcategory}</span>
          <span
            className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(var(--cat-accent-rgb), 0.12)', color: 'var(--cat-accent-soft)' }}
          >
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
      </motion.div>
    );
  };

  const renderMobileCategoryDetail = () => {
    if (!mobileCategoryView || !activeMainCategory) return null;
    const subcategories = getAvailableSubcategories(activeMainCategory);
    const descriptor = (keywordCategories[activeMainCategory] as unknown as { description: string }).description;

    return (
      <motion.div
        key={activeMainCategory + '-category-detail'}
        className="lg:hidden fixed inset-0 z-50 flex flex-col bg-background overflow-hidden"
        style={getCategoryAccentVars(activeMainCategory)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            type="button"
            onClick={() => setMobileCategoryView(false)}
            className="shrink-0 flex items-center justify-center rounded-lg h-8 w-8 border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            aria-label="Back to categories"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span
            className="shrink-0 rounded-md p-1.5"
            style={{ background: 'rgba(var(--cat-accent-rgb), 0.1)', color: 'var(--cat-accent-soft)' }}
          >
            {getCategoryIcon(activeMainCategory)}
          </span>
          <span className="font-bold text-foreground truncate flex-1">{activeMainCategory}</span>
          <span
            className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(var(--cat-accent-rgb), 0.12)', color: 'var(--cat-accent-soft)' }}
          >
            {subcategories.length} groups
          </span>
        </div>

        {descriptor && (
          <div className="shrink-0 px-4 py-2.5 bg-background/40 border-b border-border/50">
            <p className="text-xs text-muted-foreground leading-snug">{descriptor}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="mobile-subcategory-list">
            {subcategories.map((subCategoryName) => {
              const keywords = getKeywordsForSubcategory(subCategoryName);
              const description = getSubcategoryDescription(activeMainCategory, subCategoryName);

              return (
                <section key={subCategoryName} className="mobile-subcategory-row">
                  <button
                    type="button"
                    onClick={() => drillIntoSubcategory(activeMainCategory, subCategoryName)}
                    className="mobile-subcategory-button"
                  >
                    <span className="mobile-subcategory-icon">
                      {getSubcategoryIcon(subCategoryName, "w-4 h-4")}
                    </span>
                    <span className="mobile-subcategory-copy">
                      <span className="mobile-subcategory-heading">
                        <span>{subCategoryName}</span>
                        <span>{keywords.length}</span>
                      </span>
                      <span className="mobile-subcategory-description">{description}</span>
                    </span>
                    <ChevronRight className="mobile-subcategory-caret" />
                  </button>
                </section>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderMobileShelves = () => {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden lg:hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-4">
            <div className="mobile-keyword-search-wrap">
              <KeywordSearch inputRef={searchInputRef} onKeywordSelect={() => {}} />
            </div>
            {mainCategoryOrder.map((mainCat) => {
              const subcategories = getAvailableSubcategories(mainCat);
              if (subcategories.length === 0) return null;

              return (
                <section
                  key={mainCat}
                  className="mobile-category-shelf"
                  style={getCategoryAccentVars(mainCat)}
                >
                  <button
                    type="button"
                    onClick={() => drillIntoCategory(mainCat)}
                    className="mobile-category-trigger"
                  >
                    <div className="mobile-category-icon">
                      {getCategoryIcon(mainCat, "w-6 h-6")}
                    </div>
                    <div className="mobile-category-copy">
                      <span className="mobile-category-title">{mainCat}</span>
                      <div className="mobile-category-keyword-chips">
                        {getCategoryPreviewKeywords(mainCat).map(name => (
                          <span key={name} className="mobile-category-keyword-chip">{name}</span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="mobile-category-caret" />
                  </button>
                </section>
              );
            })}
            {renderKeywordSuggestion("mobile")}
          </div>
        </div>
      </div>
    );
  };

  const handleDesktopSearch = async () => {
    await searchGames();
  };

  const handleDesktopShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: 'GameFinder', url });
    } else {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleDesktopClear = () => {
    clearAllFilters();
  };

  return (
    <div className="keyword-section relative w-full h-full flex flex-col transition-all duration-500">
      <AnimatePresence>{renderMobileCategoryDetail()}</AnimatePresence>
      <AnimatePresence>{renderMobileSubcategoryDetail()}</AnimatePresence>
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
            onClick={searchFresh ? handleDesktopShare : handleDesktopSearch}
            disabled={(!hasSearchableFilters && !searchFresh) || isLoading}
            className={`hero-button desktop-action-button desktop-action-button-search ${
              hasSearchableFilters || searchFresh
                ? 'desktop-action-button-search-active'
                : 'desktop-action-button-search-disabled'
            } ${shareShineActive ? 'hero-button-share-shine' : ''}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Searching...
              </>
            ) : searchFresh ? (
              <>
                {shareCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {shareCopied ? 'Copied!' : 'Share'}
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
