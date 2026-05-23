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
  Shuffle, Star, KeyRound, Hammer,
  Infinity as InfinityIcon,
} from "lucide-react";
import KeywordSearch from './KeywordSearch';
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

type RawKw = { id: number; name: string };
const _randomKeywordPool: RawKw[] = (() => {
  const seen = new Set<number>();
  const out: RawKw[] = [];
  for (const kw of [
    ...Object.values(topKeywordsByCategory as Record<string, RawKw[]>).flat(),
    ...Object.values(extendedKeywordsByCategory as Record<string, RawKw[]>).flat(),
  ]) {
    if (!seen.has(kw.id)) { seen.add(kw.id); out.push(kw); }
  }
  return out;
})();

type MainCategory = "Mechanics & Systems" | "Setting & World" | "Aesthetics & Style";
type UtilityPanel = "intro" | "qs-keyword" | "qs-combo";
type RevealCard = "common-keyword" | "rare-combo" | "unique-keyword" | "unique-combo" | "popular" | "user-crafts";
type RarityTier = "common" | "uncommon" | "rare" | "epic" | "unique";

/** Shared model for each of the 6 discovery cards. */
interface DiscoveryCard {
  id: RevealCard;
  label: string;
  defaultText: string;
  icon: React.ComponentType<{ className?: string }>;
  apply: () => void;
  revealedName?: string;
  lastResultCount?: number;
  rarity?: RarityTier | null;
}

/** Return rarity tier based on search result count. Thresholds are tuned here. */
function getRarity(count: number): RarityTier | null {
  if (count <= 0)   return null;
  if (count <= 5)   return "unique";
  if (count <= 20)  return "epic";
  if (count <= 50)  return "rare";
  if (count <= 150) return "uncommon";
  return "common";
}

interface KeywordComboSuggestion {
  title: string;
  filters: Array<{
    id: number;
    name: string;
    category: string;
    mode?: "include" | "exclude";
  }>;
}

interface UniqueLimitsStore {
  date: string;
  kwUsed: number;
  comboUsed: number;
  lastKwName?: string;
  lastKwEmoji?: string;
  lastComboTitle?: string;
}

function loadUniqueLimits(): UniqueLimitsStore {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem('gamefinder_unique_limits');
    if (raw) {
      const parsed: UniqueLimitsStore = JSON.parse(raw);
      if (parsed.date === today) return parsed;
    }
    return { date: today, kwUsed: 0, comboUsed: 0 };
  } catch {
    return { date: new Date().toISOString().split('T')[0], kwUsed: 0, comboUsed: 0 };
  }
}

function saveUniqueLimits(state: UniqueLimitsStore): void {
  try { localStorage.setItem('gamefinder_unique_limits', JSON.stringify(state)); } catch {}
}

interface KeywordSectionProps {
  expanded: boolean;
  setActiveSection: (section: 'keywords' | 'results' | 'none') => void;
  filterSectionRef: React.RefObject<HTMLDivElement>;
  heroRef: React.RefObject<HTMLDivElement>;
}

export const KeywordSection: React.FC<KeywordSectionProps> = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const revealTimerRef = useRef<number | null>(null);
  const category = 'Keywords';
  const { addFilter, clearAllFilters, removeFilter, searchGames, selectedFilters, isLoading, searchFresh, gameResults, totalCount } = useFilters();
  const hasSearchableFilters = selectedFilters.some(filter => filter.mode !== "exclude");
  const hasDesktopActionItems = selectedFilters.length > 0;
  const [shareCopied, setShareCopied] = useState(false);
  const [shareShineActive, setShareShineActive] = useState(false);

  const mainCategoryOrder: MainCategory[] = ["Mechanics & Systems", "Setting & World", "Aesthetics & Style"];
  const [activeMainCategory, setActiveMainCategory] = useState<MainCategory | null>("Mechanics & Systems");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeUtilityPanel, setActiveUtilityPanel] = useState<UtilityPanel>("intro");
  const [mobileCategoryView, setMobileCategoryView] = useState(false);
  const [mobileSubcategoryView, setMobileSubcategoryView] = useState(false);
  const [mobileQsView, setMobileQsView] = useState<"keyword" | "combo" | null>(null);
  const [animBatchStart] = useState(0);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [activeQsKeywordIndex, setActiveQsKeywordIndex] = useState(0);
  const [activeUniqueKeywordIndex, setActiveUniqueKeywordIndex] = useState(0);
  const [activeUniqueComboIndex, setActiveUniqueComboIndex] = useState(0);
  const [commonKeywordRevealed, setCommonKeywordRevealed] = useState<{ name: string } | null>(null);
  const [rareComboRevealed, setRareComboRevealed] = useState<{ title: string } | null>(null);
  const [popularRevealed, setPopularRevealed] = useState<{ name: string } | null>(null);
  const [activePopularIndex, setActivePopularIndex] = useState(0);
  const [userCraftsRevealed, setUserCraftsRevealed] = useState(false);
  const [activeRevealCard, setActiveRevealCard] = useState<RevealCard | null>(null);
  // Rarity reveal — tracks which card was last tapped and its post-search result count
  const [activeDiscoveryCardId, setActiveDiscoveryCardId] = useState<RevealCard | null>(null);
  const [activeCardResultCount, setActiveCardResultCount] = useState<number | null>(null);
  const activeDiscoveryCardIdRef = useRef<RevealCard | null>(null);
  const resultCapturedRef = useRef(false);
  const [postClickCardId, setPostClickCardId] = useState<RevealCard | null>(null);
  const [uniqueLimits, setUniqueLimits] = useState<UniqueLimitsStore>(() => ({ date: new Date().toISOString().split('T')[0], kwUsed: 0, comboUsed: 0 }));
  const [browseOpen, setBrowseOpen] = useState(false);
  const kwRevealed = uniqueLimits.kwUsed > 0 ? { name: uniqueLimits.lastKwName ?? '', emoji: uniqueLimits.lastKwEmoji ?? '' } : null;
  const comboRevealed = uniqueLimits.comboUsed > 0 ? { title: uniqueLimits.lastComboTitle ?? '' } : null;
  const isKwRevealedState = !!kwRevealed;
  const isComboRevealedState = !!comboRevealed;
  const popularSuggestions = [
    { id: 41781, name: "Action Roguelike" },
    { id: 17326, name: "Souls-like" },
  ];

  const keywordComboSuggestions: KeywordComboSuggestion[] = [
    {
      title: "Memory Loss Horror",
      filters: [
        { id: 694, name: "Memory Loss", category },
        { id: 19, name: "Horror", category: "themes" },
      ],
    },
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
      title: "Sushi Dive Management",
      filters: [
        { id: 509, name: "Fishing", category },
        { id: 38859, name: "Restaurant Management", category },
        { id: 138, name: "Underwater", category },
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
    { id: 2158,  name: "Time Loop",     emoji: "🔄", category },
    { id: 243,   name: "Heist",         emoji: "🎭", category },
    { id: 1136,  name: "Noir",          emoji: "🕵️", category },
    { id: 2668,  name: "Alchemy",       emoji: "⚗️", category },
    { id: 38865, name: "Deckbuilder",   emoji: "🃏", category },
    { id: 43194, name: "Immersive Sim", emoji: "🧩", category },
  ];

  const uniqueKeywords = [
    { id: 41980, name: "Hiking",                    emoji: "🥾", category },
    { id: 41907, name: "Bank Robbery",              emoji: "🏦", category },
    { id: 38428, name: "Solarpunk",                 emoji: "🌿", category },
    { id: 44092, name: "Astronomy",                 emoji: "🔭", category },
    { id: 38817, name: "Avant Garde",               emoji: "🎨", category },
    { id: 42679, name: "Food Truck",                emoji: "🚚", category },
    { id: 44749, name: "Canoeing",                  emoji: "🛶", category },
    { id: 38661, name: "K-Pop",                     emoji: "🎤", category },
    { id: 41829, name: "Air Traffic Control",       emoji: "✈️", category },
    { id: 38790, name: "Snowmobile",                emoji: "🏔️", category },
    { id: 44093, name: "Astrology",                 emoji: "🔮", category },
    { id: 41985, name: "Auction",                   emoji: "🔨", category },
    { id: 43130, name: "Aviation",                  emoji: "🛩️", category },
    { id: 38537, name: "Badminton",                 emoji: "🏸", category },
    { id: 41880, name: "Bakery",                    emoji: "🥐", category },
    { id: 5709,  name: "Cauldron",                  emoji: "🪄", category },
    { id: 43191, name: "Community Sim",             emoji: "🏘️", category },
    { id: 37918, name: "Deep Web",                  emoji: "🌐", category },
    { id: 39395, name: "Eldritch Romance",          emoji: "🖤", category },
    { id: 44171, name: "Hoverboard",                emoji: "🛹", category },
    { id: 44031, name: "Laser Tag",                 emoji: "🎯", category },
    { id: 39454, name: "Nasa Punk",                 emoji: "🚀", category },
    { id: 44022, name: "Occupational Simulation",   emoji: "👷", category },
    { id: 37981, name: "Petanque",                  emoji: "🪨", category },
    { id: 39523, name: "Ping Pong",                 emoji: "🏓", category },
    { id: 38215, name: "Rage Room",                 emoji: "💥", category },
    { id: 1030,  name: "Roller Coaster",            emoji: "🎢", category },
    { id: 38397, name: "Spectacle Platformer",      emoji: "🎭", category },
    { id: 37948, name: "Void",                      emoji: "🌑", category },
    { id: 4893,  name: "Wall Run",                  emoji: "🏃", category },
  ];

  const uniqueComboSuggestions: KeywordComboSuggestion[] = [
    {
      title: "Hiking Exploration",
      filters: [
        { id: 41980, name: "Hiking", category },
        { id: 72,    name: "Exploration", category },
      ],
    },
    {
      title: "Bank Robbery Shooter",
      filters: [
        { id: 41907, name: "Bank Robbery", category },
        { id: 5,     name: "Shooter", category: "genres" },
      ],
    },
    {
      title: "Solarpunk Strategy",
      filters: [
        { id: 38428, name: "Solarpunk", category },
        { id: 15,    name: "Strategy", category: "genres" },
      ],
    },
    {
      title: "Astronomy Simulator",
      filters: [
        { id: 44092, name: "Astronomy", category },
        { id: 13,    name: "Simulator", category: "genres" },
      ],
    },
    {
      title: "Air Traffic Sim",
      filters: [
        { id: 41829, name: "Air Traffic Control", category },
        { id: 13,    name: "Simulator", category: "genres" },
      ],
    },
  ];

  const commonKeywordState = "Random keyword";
  const rareComboState = "GameFinder combo";
  const isCommonKeywordRevealed = !!commonKeywordRevealed;
  const isRareComboRevealed = !!rareComboRevealed;
  const getStepLabel = (index: number, total: number) => `${index + 1}/${total}`;
  const getPaddedStepLabel = (index: number, total: number) =>
    `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  const renderSequencePips = (index: number, total: number) => {
    const pipCount = Math.min(5, total);
    const activePip = Math.min(pipCount - 1, Math.floor((index / Math.max(total - 1, 1)) * pipCount));

    return (
      <span className="qs-sequence-pips" aria-hidden="true">
        {Array.from({ length: pipCount }, (_, pipIndex) => (
          <span
            key={pipIndex}
            className={`qs-sequence-pip${pipIndex === activePip ? ' qs-sequence-pip-active' : ''}`}
          />
        ))}
      </span>
    );
  };
  const popularStep = getStepLabel(activePopularIndex, popularSuggestions.length);
  const craftedStep = getStepLabel(activeSuggestionIndex, keywordComboSuggestions.length);
  const uniqueKeywordDisplayIndex = isKwRevealedState
    ? Math.max(0, Math.min(uniqueLimits.kwUsed - 1, uniqueKeywords.length - 1))
    : activeUniqueKeywordIndex;
  const uniqueComboDisplayIndex = isComboRevealedState
    ? Math.max(0, Math.min(uniqueLimits.comboUsed - 1, uniqueComboSuggestions.length - 1))
    : activeUniqueComboIndex;
  const uniqueKeywordDisplayStep = getPaddedStepLabel(uniqueKeywordDisplayIndex, uniqueKeywords.length);
  const uniqueComboDisplayStep = getPaddedStepLabel(uniqueComboDisplayIndex, uniqueComboSuggestions.length);

  const triggerCardReveal = (card: RevealCard) => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    setActiveRevealCard(null);
    window.setTimeout(() => setActiveRevealCard(card), 0);
    revealTimerRef.current = window.setTimeout(() => {
      setActiveRevealCard(null);
      revealTimerRef.current = null;
    }, 850);
  };

  /** Call instead of triggerCardReveal for all 6 discovery cards. Marks the card
   *  as active so the rarity class can be applied once results arrive. */
  const activateDiscoveryCard = (card: RevealCard) => {
    triggerCardReveal(card);
    setActiveDiscoveryCardId(card);
    activeDiscoveryCardIdRef.current = card;
    setActiveCardResultCount(null);
    resultCapturedRef.current = false;
    setPostClickCardId(card);
  };

  /** Rarity for the given card — non-null only after its search has returned results. */
  const getActiveRarity = (card: RevealCard): RarityTier | null =>
    card === activeDiscoveryCardId && activeCardResultCount !== null
      ? getRarity(activeCardResultCount)
      : null;

  const getCardClassName = (baseClass: string, card: RevealCard, hasResult = false) => {
    const rarity = getActiveRarity(card);
    return [
      'qs-card',
      baseClass,
      hasResult ? 'qs-card-has-result' : '',
      activeRevealCard === card ? 'qs-card-reveal-pulse' : '',
      rarity ? `qs-card-rarity-${rarity}` : '',
      postClickCardId === card ? 'qs-card-post-click' : '',
    ].filter(Boolean).join(' ');
  };

  /** Wrapper class for a discovery card — adds --unique modifier when unique-tier. */
  const getCardWrapClass = (card: RevealCard): string =>
    getActiveRarity(card) === "unique" ? "qs-card-wrap qs-card-wrap--unique" : "qs-card-wrap";

  const applyCommonKeyword = () => {
    activateDiscoveryCard("common-keyword");
    clearAllFilters();
    const kw = _randomKeywordPool[Math.floor(Math.random() * _randomKeywordPool.length)];
    const name = kw.name.replace(/\b\w/g, c => c.toUpperCase());
    addFilter({ id: kw.id, name, category, mode: "include" });
    setCommonKeywordRevealed({ name });
  };

  const applyRareCombo = () => {
    activateDiscoveryCard("rare-combo");
    clearAllFilters();
    const suggestion = keywordComboSuggestions[activeSuggestionIndex];
    suggestion.filters.forEach(filter => {
      addFilter({
        id: filter.id,
        name: filter.name.replace(/\b\w/g, c => c.toUpperCase()),
        category: filter.category,
        mode: filter.category === category ? filter.mode || "include" : undefined,
      });
    });
    setRareComboRevealed({ title: suggestion.title });
    setActiveSuggestionIndex(i => (i + 1) % keywordComboSuggestions.length);
  };

  const applyUniqueKeyword = () => {
    activateDiscoveryCard("unique-keyword");
    clearAllFilters();
    const kw = uniqueKeywords[activeUniqueKeywordIndex];
    addFilter({ id: kw.id, name: kw.name.replace(/\b\w/g, c => c.toUpperCase()), category, mode: "include" });
    const newLimits: UniqueLimitsStore = { ...uniqueLimits, kwUsed: activeUniqueKeywordIndex + 1, lastKwName: kw.name, lastKwEmoji: kw.emoji };
    saveUniqueLimits(newLimits);
    setUniqueLimits(newLimits);
    setActiveUniqueKeywordIndex(i => (i + 1) % uniqueKeywords.length);
  };

  const applyUniqueCombo = () => {
    activateDiscoveryCard("unique-combo");
    clearAllFilters();
    const suggestion = uniqueComboSuggestions[activeUniqueComboIndex];
    suggestion.filters.forEach(filter => {
      addFilter({
        id: filter.id,
        name: filter.name.replace(/\b\w/g, c => c.toUpperCase()),
        category: filter.category,
        mode: filter.category === category ? filter.mode || "include" : undefined,
      });
    });
    const newLimits: UniqueLimitsStore = { ...uniqueLimits, comboUsed: activeUniqueComboIndex + 1, lastComboTitle: suggestion.title };
    saveUniqueLimits(newLimits);
    setUniqueLimits(newLimits);
    setActiveUniqueComboIndex(i => (i + 1) % uniqueComboSuggestions.length);
  };

  const applyPopular = () => {
    activateDiscoveryCard("popular");
    clearAllFilters();
    const kw = popularSuggestions[activePopularIndex];
    addFilter({ id: kw.id, name: kw.name, category, mode: "include" });
    setPopularRevealed({ name: kw.name });
    setActivePopularIndex(i => (i + 1) % popularSuggestions.length);
  };

  const applyUserCrafts = () => {
    activateDiscoveryCard("user-crafts");
    clearAllFilters();
    addFilter({ id: 2379, name: "Cosmic Horror", category, mode: "include" });
    addFilter({ id: 32, name: "Indie", category: "genres" });
    setUserCraftsRevealed(true);
  };

  useEffect(() => {
    const handlePopState = () => {
      if (mobileSubcategoryView) {
        setMobileSubcategoryView(false);
      } else if (mobileQsView !== null) {
        setMobileQsView(null);
      } else if (mobileCategoryView) {
        setMobileCategoryView(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mobileSubcategoryView, mobileQsView, mobileCategoryView]);

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

  // Capture result count once per fresh search completion for rarity reveal.
  // Intentionally excludes gameResults from deps: we want exactly one capture per
  // fresh search, not a re-fire on every loadMore batch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (searchFresh && !isLoading && activeDiscoveryCardIdRef.current !== null && !resultCapturedRef.current) {
      if (gameResults.length > 0) {
        setActiveCardResultCount(totalCount ?? gameResults.length);
      }
      resultCapturedRef.current = true;
    }
  }, [searchFresh, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  const selectMainCategory = (cat: MainCategory) => {
    setActiveMainCategory(current => current === cat ? null : cat);
    setActiveSubcategory(null);
    setActiveUtilityPanel("intro");
    setMobileCategoryView(false);
    setMobileSubcategoryView(false);
  };

  const drillIntoCategory = (cat: MainCategory) => {
    setActiveMainCategory(cat);
    setActiveSubcategory(null);
  };

  const drillIntoSubcategory = (mainCat: MainCategory, subCategoryName: string) => {
    window.history.pushState({ gamefinder: 'subcategory' }, '');
    setActiveMainCategory(mainCat);
    setActiveSubcategory(subCategoryName);
    setActiveUtilityPanel("intro");
    setMobileCategoryView(true);
    setMobileSubcategoryView(true);
  };

  const getCategoryIcon = (mainCat: MainCategory, size = "w-5 h-5") => {
    if (mainCat === "Mechanics & Systems") return <Cog className={size} />;
    if (mainCat === "Setting & World") return <Globe className={size} />;
    return <Palette className={size} />;
  };

  const getCategoryAccentVars = (_mainCat: MainCategory): React.CSSProperties => {
    return {
      '--cat-accent-rgb': 'var(--c-emerald-rgb)',
      '--cat-accent-soft': 'var(--c-emerald-soft)',
    } as React.CSSProperties;
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

  const getKeywordCountForSubcategory = (subCategoryName: string): number =>
    getKeywordsForSubcategory(subCategoryName).length + getExtendedKeywordsForSubcategory(subCategoryName).length;

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
    const displayedKeywords = [...topKeywords, ...extendedKeywords];
    const mainCat = getSubcategoryParent(subCategoryName);

    return {
      topKeywords,
      extendedKeywords,
      displayedKeywords,
      totalKeywords: displayedKeywords.length,
      description: mainCat ? getSubcategoryDescription(mainCat, subCategoryName) : "",
    };
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
          <h3>Pick 2–3 keywords. Describe a vibe.</h3>
          <p>
            Browse 5,000+ curated tags — mechanics, settings, aesthetics. Combine them to surface games that match the exact feel you're after.
          </p>
        </div>
      </div>
    </div>
  );

  const renderKeywordPanel = (subCategoryName: string, variant: "desktop" | "mobile") => {
    const { displayedKeywords, totalKeywords, description } = getKeywordPanelData(subCategoryName);

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
                  {totalKeywords} keywords
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-snug">{description}</p>
            </div>
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

  const renderDesktopExplorer = () => null;

  const renderMobileSubcategoryDetail = () => {
    if (!mobileSubcategoryView || !activeSubcategory) return null;
    const { displayedKeywords, description, totalKeywords } = getKeywordPanelData(activeSubcategory);

    return (
      <motion.div
        key={activeSubcategory}
        className="fixed inset-0 z-[60] flex flex-col bg-background overflow-hidden"
        style={activeMainCategory ? getCategoryAccentVars(activeMainCategory) : {}}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            type="button"
            onClick={() => window.history.back()}
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
            {totalKeywords}
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
        className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden"
        style={getCategoryAccentVars(activeMainCategory)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            type="button"
            onClick={() => window.history.back()}
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
              const keywordCount = getKeywordCountForSubcategory(subCategoryName);
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
                        <span>{keywordCount}</span>
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

  const renderMobileQsDetail = () => {
    if (!mobileQsView) return null;
    const isKeyword = mobileQsView === "keyword";
    return (
      <motion.div
        key={`mobile-qs-${mobileQsView}`}
        className="fixed inset-0 z-[60] flex flex-col bg-background overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="shrink-0 flex items-center justify-center rounded-lg h-8 w-8 border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {isKeyword
            ? <KeyRound className="h-4 w-4 text-primary" />
            : <Hammer className="h-4 w-4 text-primary" />}
          <span className="font-bold text-foreground">
            {isKeyword ? commonKeywordState : rareComboState}
          </span>
        </div>
        <div className="flex-1 min-h-0">
          {isKeyword ? renderQsKeywordPanel() : renderQsComboPanel()}
        </div>
      </motion.div>
    );
  };

  const renderMobileShelves = () => {
    const inlineKwData = activeSubcategory ? getKeywordPanelData(activeSubcategory) : null;
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden lg:flex-none lg:overflow-visible">
        <div className="flex-1 overflow-y-auto lg:flex-none lg:overflow-visible">
          <div className="grid gap-4">
            <div className="mobile-keyword-search-wrap">
              <KeywordSearch inputRef={searchInputRef} onKeywordSelect={() => {}} />
            </div>
            <section className="grid gap-3 mx-1">
              {/* Browse all keywords toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !browseOpen;
                  setBrowseOpen(next);
                  if (next && !activeMainCategory) {
                    setActiveMainCategory("Mechanics & Systems");
                  }
                }}
                className={`keyword-browse-card${browseOpen ? ' keyword-browse-card-open' : ''}`}
              >
                <span className="keyword-browse-icon">
                  <LayoutGrid className="w-4 h-4" />
                </span>
                <span className="keyword-browse-copy">
                  <span className="keyword-browse-title">Browse all keywords</span>
                  <span className="keyword-browse-subtitle">Explore categories, vibes, mechanics, and worlds</span>
                </span>
                <ChevronDown className={`keyword-browse-chevron ${browseOpen ? 'rotate-180' : ''}`} />
              </button>

              {browseOpen ? (
                <>
                  <div className="mobile-cat-segmented">
                    {mainCategoryOrder
                      .filter(mainCat => getAvailableSubcategories(mainCat).length > 0)
                      .map(mainCat => {
                        const shortLabel = ({ "Mechanics & Systems": "Mechanics", "Setting & World": "Setting", "Aesthetics & Style": "Aesthetics" } as Record<MainCategory, string>)[mainCat];
                        return (
                          <button
                            key={mainCat}
                            type="button"
                            onClick={() => drillIntoCategory(mainCat)}
                            className={`mobile-cat-segment${activeMainCategory === mainCat ? ' mobile-cat-segment-active' : ''}`}
                            style={getCategoryAccentVars(mainCat)}
                          >
                            {getCategoryIcon(mainCat, "w-3.5 h-3.5")}
                            <span>{shortLabel}</span>
                          </button>
                        );
                      })}
                  </div>

                  {activeMainCategory && (
                    <div className="mobile-inline-cat-content" style={getCategoryAccentVars(activeMainCategory)}>
                      {activeSubcategory && inlineKwData ? (
                        <>
                          <div className="mobile-inline-kw-header">
                            <button
                              type="button"
                              onClick={() => setActiveSubcategory(null)}
                              className="mobile-inline-back-btn"
                              aria-label="Back"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="mobile-inline-kw-icon">
                              {getSubcategoryIcon(activeSubcategory, "w-3.5 h-3.5")}
                            </span>
                            <span className="mobile-inline-kw-name">{activeSubcategory}</span>
                          </div>
                          <div className="keyword-inline-list mobile-inline-kw-list">
                            {inlineKwData.displayedKeywords.map((keyword, index) => renderKeywordPill(keyword, index, animBatchStart))}
                          </div>
                        </>
                      ) : (
                        <div className="mobile-subcategory-list">
                          {getAvailableSubcategories(activeMainCategory).map((subCategoryName) => {
                            const keywordCount = getKeywordCountForSubcategory(subCategoryName);
                            const description = getSubcategoryDescription(activeMainCategory, subCategoryName);
                            return (
                              <section key={subCategoryName} className="mobile-subcategory-row">
                                <button
                                  type="button"
                                  onClick={() => setActiveSubcategory(subCategoryName)}
                                  className="mobile-subcategory-button"
                                >
                                  <span className="mobile-subcategory-icon">
                                    {getSubcategoryIcon(subCategoryName, "w-4 h-4")}
                                  </span>
                                  <span className="mobile-subcategory-copy">
                                    <span className="mobile-subcategory-heading">
                                      <span>{subCategoryName}</span>
                                      <span>{keywordCount}</span>
                                    </span>
                                    <span className="mobile-subcategory-description">{description}</span>
                                  </span>
                                  <ChevronRight className="mobile-subcategory-caret" />
                                </button>
                              </section>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="qs-discovery-matrix">
                    <div className="qs-discovery-columns" aria-hidden="true">
                      <span>
                        <KeyRound className="w-3 h-3" />
                        Keys
                      </span>
                      <span>
                        <Hammer className="w-3 h-3" />
                        Crafts
                      </span>
                    </div>
                    <div className="qs-cards-grid qs-cards-grid--matrix">
                      <div className={getCardWrapClass('popular')}>
                        <button
                          type="button"
                          onClick={applyPopular}
                          onMouseLeave={() => setPostClickCardId(null)}
                          className={getCardClassName('qs-card-rnd-kw', 'popular', !!popularRevealed)}
                        >
                          <span className="qs-card-shine" aria-hidden="true" />
                          <KeyRound className="qs-card-type-icon" aria-hidden="true" />
                          {getActiveRarity('popular') && (
                            <span className="qs-card-rarity-label">{getActiveRarity('popular')}</span>
                          )}
                          <span className="qs-card-unidentified-label" aria-hidden="true">Unidentified</span>
                          <span className="qs-card-main">
                            <span className="qs-card-action-label">
                              <Dices className="qs-card-action-icon" />
                              Roll popular
                            </span>
                            <span className="qs-state-revealed qs-card-state-line">{popularRevealed?.name ?? ''}</span>
                          </span>
                          <span className="qs-card-footer">
                            <span className="qs-state-initial qs-card-state-line qs-card-footer-copy">Top key this week</span>
                            <span className="qs-card-meta">{popularStep}</span>
                          </span>
                        </button>
                      </div>
                      <div className={getCardWrapClass('rare-combo')}>
                        <button
                          type="button"
                          onClick={applyRareCombo}
                          onMouseLeave={() => setPostClickCardId(null)}
                          className={getCardClassName('qs-card-rnd-combo', 'rare-combo', isRareComboRevealed)}
                        >
                          <span className="qs-card-shine" aria-hidden="true" />
                          <Hammer className="qs-card-type-icon" aria-hidden="true" />
                          {getActiveRarity('rare-combo') && (
                            <span className="qs-card-rarity-label">{getActiveRarity('rare-combo')}</span>
                          )}
                          <span className="qs-card-unidentified-label" aria-hidden="true">Unidentified</span>
                          <span className="qs-card-main">
                            <span className="qs-card-action-label">
                              <Wand2 className="qs-card-action-icon" />
                              Craft curated
                            </span>
                            <span className="qs-state-revealed qs-card-state-line">{rareComboRevealed?.title ?? ''}</span>
                          </span>
                          <span className="qs-card-footer">
                            <span className="qs-state-initial qs-card-state-line qs-card-footer-copy">{rareComboState}</span>
                            <span className="qs-card-meta">{craftedStep}</span>
                          </span>
                        </button>
                      </div>
                      <div className={getCardWrapClass('common-keyword')}>
                        <button
                          type="button"
                          onClick={applyCommonKeyword}
                          onMouseLeave={() => setPostClickCardId(null)}
                          className={getCardClassName('qs-card-popular', 'common-keyword', isCommonKeywordRevealed)}
                        >
                          <span className="qs-card-shine" aria-hidden="true" />
                          <KeyRound className="qs-card-type-icon" aria-hidden="true" />
                          {getActiveRarity('common-keyword') && (
                            <span className="qs-card-rarity-label">{getActiveRarity('common-keyword')}</span>
                          )}
                          <span className="qs-card-unidentified-label" aria-hidden="true">Unidentified</span>
                          <span className="qs-card-main">
                            <span className="qs-card-action-label">
                              <Shuffle className="qs-card-action-icon" />
                              Roll random
                            </span>
                            <span className="qs-state-revealed qs-card-state-line">{commonKeywordRevealed?.name ?? ''}</span>
                          </span>
                          <span className="qs-card-footer">
                            <span className="qs-state-initial qs-card-state-line qs-card-footer-copy">{commonKeywordState}</span>
                            <span className="qs-card-meta"><InfinityIcon className="qs-step-icon" aria-label="infinite" /></span>
                          </span>
                        </button>
                      </div>
                      <div className={getCardWrapClass('user-crafts')}>
                        <button
                          type="button"
                          onClick={applyUserCrafts}
                          onMouseLeave={() => setPostClickCardId(null)}
                          className={getCardClassName('qs-card-user-crafts', 'user-crafts', userCraftsRevealed)}
                        >
                          <span className="qs-card-shine" aria-hidden="true" />
                          <Hammer className="qs-card-type-icon" aria-hidden="true" />
                          {getActiveRarity('user-crafts') && (
                            <span className="qs-card-rarity-label">{getActiveRarity('user-crafts')}</span>
                          )}
                          <span className="qs-card-unidentified-label" aria-hidden="true">Unidentified</span>
                          <span className="qs-card-main">
                            <span className="qs-card-action-label">
                              <Users className="qs-card-action-icon" />
                              Try community
                            </span>
                            <span className="qs-state-revealed qs-card-state-line">Eldritch Indie</span>
                          </span>
                          <span className="qs-card-footer">
                            <span className="qs-state-initial qs-card-state-line qs-card-footer-copy">Community combo</span>
                            <span className="qs-card-meta">1/1</span>
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="qs-uniques-divider">
                      <Star className="w-3 h-3" />
                      Uniques
                    </div>
                    <div className="qs-cards-grid qs-cards-grid--matrix">
                      <div className={`qs-unique-wrap ${getCardWrapClass('unique-keyword')}`}>
                        <button
                          type="button"
                          onClick={applyUniqueKeyword}
                          onMouseLeave={() => setPostClickCardId(null)}
                          className={getCardClassName('qs-card-unique-kw', 'unique-keyword', isKwRevealedState)}
                        >
                          <span className="qs-card-shine" aria-hidden="true" />
                          <KeyRound className="qs-card-type-icon" aria-hidden="true" />
                          {getActiveRarity('unique-keyword') && (
                            <span className="qs-card-rarity-label">{getActiveRarity('unique-keyword')}</span>
                          )}
                          <span className="qs-card-unidentified-label" aria-hidden="true">Unidentified</span>
                          <span className="qs-card-main">
                            <span className="qs-card-action-label">
                              <Sparkles className="qs-card-action-icon" />
                              Discover unique
                            </span>
                            <span className="qs-state-revealed qs-card-state-line">
                              {kwRevealed?.name ?? ''}
                            </span>
                          </span>
                          <span className="qs-card-footer qs-card-footer-sequence">
                            <span className="qs-state-initial qs-card-state-line">
                              &lt;5 results
                            </span>
                            <span className="qs-sequence-track">
                              {renderSequencePips(uniqueKeywordDisplayIndex, uniqueKeywords.length)}
                              <span className="qs-sequence-count">{uniqueKeywordDisplayStep}</span>
                            </span>
                          </span>
                        </button>
                      </div>
                      <div className={`qs-unique-wrap ${getCardWrapClass('unique-combo')}`}>
                        <button
                          type="button"
                          onClick={applyUniqueCombo}
                          onMouseLeave={() => setPostClickCardId(null)}
                          className={getCardClassName('qs-card-unique-combo', 'unique-combo', isComboRevealedState)}
                        >
                          <span className="qs-card-shine" aria-hidden="true" />
                          <Hammer className="qs-card-type-icon" aria-hidden="true" />
                          {getActiveRarity('unique-combo') && (
                            <span className="qs-card-rarity-label">{getActiveRarity('unique-combo')}</span>
                          )}
                          <span className="qs-card-unidentified-label" aria-hidden="true">Unidentified</span>
                          <span className="qs-card-main">
                            <span className="qs-card-action-label">
                              <Wand2 className="qs-card-action-icon" />
                              Craft unique
                            </span>
                            <span className="qs-state-revealed qs-card-state-line">
                              {comboRevealed?.title ?? ''}
                            </span>
                          </span>
                          <span className="qs-card-footer qs-card-footer-sequence">
                            <span className="qs-state-initial qs-card-state-line">
                              &lt;5 results
                            </span>
                            <span className="qs-sequence-track">
                              {renderSequencePips(uniqueComboDisplayIndex, uniqueComboSuggestions.length)}
                              <span className="qs-sequence-count">{uniqueComboDisplayStep}</span>
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
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
    <div className="keyword-section relative w-full h-full lg:h-auto flex flex-col transition-all duration-500">
      <AnimatePresence>{renderMobileCategoryDetail()}</AnimatePresence>
      <AnimatePresence>{renderMobileSubcategoryDetail()}</AnimatePresence>
      <AnimatePresence>{renderMobileQsDetail()}</AnimatePresence>
      <Navbar />

      <div className={`desktop-action-bar ${hasDesktopActionItems ? 'desktop-action-bar-visible' : 'desktop-action-bar-empty'} hidden lg:grid border-b border-border`}>
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

      <div className="flex-1 min-h-0 p-3 lg:flex-none">
        <div className="flex h-full min-h-0 flex-col gap-5 lg:h-auto">
          {renderDesktopExplorer()}
          {renderMobileShelves()}
        </div>
      </div>
    </div>
  );
};
