import React, { useEffect, useRef, useState } from "react";
import topKeywordsByCategory from "../assets/top_keywords_by_category.json";
import extendedKeywordsByCategory from "../assets/extended_keywords_by_category.json";
import {
  Sparkles, WandSparkles, Flame, Gem,
  Search, Share2, Check, ScrollText,
  Shuffle,
} from "lucide-react";
import KeywordSearch from './KeywordSearch';
import KeywordMap from './KeywordMap';
import { useSelectionCount } from '../hooks/useSelectionCount';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { formatCount, type CountResult } from '../lib/searchCount';
import { SelectedFilters } from './SelectedFilters';
import { useFilters, type Filter as FilterItem } from '../context/FilterContext';
import { Wayfinder, type WayfinderBearing, type WayfinderDraw } from './Wayfinder';
import { track } from '../lib/funnel';
import type { RevealCard } from '../lib/discoveryCards';

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

function saveUniqueLimits(state: UniqueLimitsStore): void {
  try { localStorage.setItem('gamefinder_unique_limits', JSON.stringify(state)); } catch {}
}

const CATEGORY = 'Keywords';

const popularSuggestions = [
  { id: 41781, name: "Action Roguelike" },
  { id: 17326, name: "Souls-like" },
];

const keywordComboSuggestions: KeywordComboSuggestion[] = [
  {
    title: "Memory Loss Horror",
    filters: [
      { id: 694, name: "Memory Loss", category: CATEGORY },
      { id: 19, name: "Horror", category: "themes" },
    ],
  },
  {
    title: "Poker Roguelike",
    filters: [
      { id: 154, name: "Poker", category: CATEGORY },
      { id: 27419, name: "Roguelike Deckbuilder", category: CATEGORY },
      { id: 35, name: "Card & Board Game", category: "genres" },
    ],
  },
  {
    title: "Storm City Roguelite",
    filters: [
      { id: 3533, name: "City Builder", category: CATEGORY },
      { id: 17292, name: "Roguelite", category: CATEGORY },
      { id: 606, name: "Resource Management", category: CATEGORY },
    ],
  },
  {
    title: "Sushi Dive Management",
    filters: [
      { id: 509, name: "Fishing", category: CATEGORY },
      { id: 38859, name: "Restaurant Management", category: CATEGORY },
      { id: 138, name: "Underwater", category: CATEGORY },
    ],
  },
  {
    title: "Roadtrip Survival",
    filters: [
      { id: 778, name: "Driving", category: CATEGORY },
      { id: 21, name: "Survival", category: "themes" },
      { id: 1, name: "First person", category: "Perspective" },
    ],
  },
  {
    title: "Side-Scroll Souls",
    filters: [
      { id: 288, name: "2D", category: CATEGORY },
      { id: 17326, name: "Souls-like", category: CATEGORY },
      { id: 78, name: "Anime", category: CATEGORY, mode: "exclude" },
    ],
  },
  {
    title: "Cozy Indie Hangout",
    filters: [
      { id: 24685, name: "Cozy", category: CATEGORY },
      { id: 2084, name: "Relaxing", category: CATEGORY },
      { id: 2, name: "Multiplayer", category: "Game Mode" },
      { id: 32, name: "Indie", category: "genres" },
    ],
  },
];

const uniqueKeywords = [
  { id: 41980, name: "Hiking",                    emoji: "🥾" },
  { id: 41907, name: "Bank Robbery",              emoji: "🏦" },
  { id: 38428, name: "Solarpunk",                 emoji: "🌿" },
  { id: 44092, name: "Astronomy",                 emoji: "🔭" },
  { id: 38817, name: "Avant Garde",               emoji: "🎨" },
  { id: 42679, name: "Food Truck",                emoji: "🚚" },
  { id: 44749, name: "Canoeing",                  emoji: "🛶" },
  { id: 38661, name: "K-Pop",                     emoji: "🎤" },
  { id: 41829, name: "Air Traffic Control",       emoji: "✈️" },
  { id: 38790, name: "Snowmobile",                emoji: "🏔️" },
  { id: 44093, name: "Astrology",                 emoji: "🔮" },
  { id: 41985, name: "Auction",                   emoji: "🔨" },
  { id: 43130, name: "Aviation",                  emoji: "🛩️" },
  { id: 38537, name: "Badminton",                 emoji: "🏸" },
  { id: 41880, name: "Bakery",                    emoji: "🥐" },
  { id: 5709,  name: "Cauldron",                  emoji: "🪄" },
  { id: 43191, name: "Community Sim",             emoji: "🏘️" },
  { id: 37918, name: "Deep Web",                  emoji: "🌐" },
  { id: 39395, name: "Eldritch Romance",          emoji: "🖤" },
  { id: 44171, name: "Hoverboard",                emoji: "🛹" },
  { id: 44031, name: "Laser Tag",                 emoji: "🎯" },
  { id: 39454, name: "Nasa Punk",                 emoji: "🚀" },
  { id: 44022, name: "Occupational Simulation",   emoji: "👷" },
  { id: 37981, name: "Petanque",                  emoji: "🪨" },
  { id: 39523, name: "Ping Pong",                 emoji: "🏓" },
  { id: 38215, name: "Rage Room",                 emoji: "💥" },
  { id: 1030,  name: "Roller Coaster",            emoji: "🎢" },
  { id: 38397, name: "Spectacle Platformer",      emoji: "🎭" },
  { id: 37948, name: "Void",                      emoji: "🌑" },
  { id: 4893,  name: "Wall Run",                  emoji: "🏃" },
];

const uniqueComboSuggestions: KeywordComboSuggestion[] = [
  {
    title: "Hiking Exploration",
    filters: [
      { id: 41980, name: "Hiking", category: CATEGORY },
      { id: 72,    name: "Exploration", category: CATEGORY },
    ],
  },
  {
    title: "Bank Robbery Shooter",
    filters: [
      { id: 41907, name: "Bank Robbery", category: CATEGORY },
      { id: 5,     name: "Shooter", category: "genres" },
    ],
  },
  {
    title: "Solarpunk Strategy",
    filters: [
      { id: 38428, name: "Solarpunk", category: CATEGORY },
      { id: 15,    name: "Strategy", category: "genres" },
    ],
  },
  {
    title: "Astronomy Simulator",
    filters: [
      { id: 44092, name: "Astronomy", category: CATEGORY },
      { id: 13,    name: "Simulator", category: "genres" },
    ],
  },
  {
    title: "Air Traffic Sim",
    filters: [
      { id: 41829, name: "Air Traffic Control", category: CATEGORY },
      { id: 13,    name: "Simulator", category: "genres" },
    ],
  },
];

const titleCase = (name: string) => name.replace(/\b\w/g, c => c.toUpperCase());

const comboFilters = (suggestion: KeywordComboSuggestion): FilterItem[] =>
  suggestion.filters.map(filter => ({
    id: filter.id,
    name: titleCase(filter.name),
    category: filter.category,
    mode: filter.category === CATEGORY ? filter.mode || "include" : undefined,
  }));

interface KeywordSectionProps {
  /** Mobile: show the results view (results live behind the map, not beside it). */
  onShowResults?: () => void;
}

/**
 * The keyword builder: one KeywordMap (desktop pane or full mobile screen) with
 * the search built in, the selection and Search floating on it, and the
 * Wayfinder behind "Need a spark?". Owns all Wayfinder draw state.
 */
export const KeywordSection: React.FC<KeywordSectionProps> = ({ onShowResults }) => {
  const searchRef = useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const variant = isDesktop ? 'desktop' : 'mobile';

  // "/" jumps to the keyword search, unless already typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const input = searchRef.current;
      if (!input || input.offsetParent === null) return;
      e.preventDefault();
      input.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const { addFilter, clearAllFilters, searchGames, selectedFilters, isLoading, searchFresh, gameResults, totalCount, countIsCapped } = useFilters();
  const selectionCount = useSelectionCount();
  const zeroSelection = selectionCount.status === 'ready' && selectionCount.count === 0;
  const hasSearchableFilters = selectedFilters.some(filter => filter.mode !== "exclude");
  const [shareCopied, setShareCopied] = useState(false);
  const [shareShineActive, setShareShineActive] = useState(false);

  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [activeUniqueKeywordIndex, setActiveUniqueKeywordIndex] = useState(0);
  const [activeUniqueComboIndex, setActiveUniqueComboIndex] = useState(0);
  const [activePopularIndex, setActivePopularIndex] = useState(0);
  const [uniqueLimits, setUniqueLimits] = useState<UniqueLimitsStore>(() => ({ date: new Date().toISOString().split('T')[0], kwUsed: 0, comboUsed: 0 }));
  // Wayfinder: the current destination and this session's routes.
  const [relic, setRelic] = useState<WayfinderDraw | null>(null);
  const [relicHistory, setRelicHistory] = useState<WayfinderDraw[]>([]);
  const relicSeqRef = useRef(0);
  const relicDrawnAtRef = useRef(0);
  const relicFiltersRef = useRef(new Map<number, FilterItem[]>());

  /** A draw from one bearing resets the other unique sequence's "last drawn" marker. */
  const resetOtherUniques = (card: RevealCard) => {
    setUniqueLimits(prev => {
      const next: UniqueLimitsStore = {
        ...prev,
        ...(card !== 'unique-keyword' ? { kwUsed: 0, lastKwName: undefined, lastKwEmoji: undefined } : {}),
        ...(card !== 'unique-combo' ? { comboUsed: 0, lastComboTitle: undefined } : {}),
      };
      saveUniqueLimits(next);
      return next;
    });
  };

  /** Sets a fresh destination; its count is locked once known (see the identify effect). */
  const recordDraw = (card: RevealCard, filters: FilterItem[], title?: string) => {
    const draw: WayfinderDraw = { id: ++relicSeqRef.current, card, title, parts: filters.map(f => f.name) };
    relicFiltersRef.current.set(draw.id, filters);
    relicDrawnAtRef.current = Date.now();
    setRelic(draw);
    setRelicHistory(prev => [draw, ...prev].slice(0, 8));
    track('wayfinder_draw', { card });
  };

  /** Trail: restore an earlier destination with its filters. */
  const restoreRelic = (draw: WayfinderDraw) => {
    const filters = relicFiltersRef.current.get(draw.id);
    if (!filters) return;
    clearAllFilters();
    filters.forEach(f => addFilter(f));
    setRelic(draw);
    setRelicHistory(prev => [draw, ...prev.filter(d => d.id !== draw.id)]);
    track('wayfinder_restore', { card: draw.card });
  };

  const applyCommonKeyword = () => {
    resetOtherUniques("common-keyword");
    clearAllFilters();
    const kw = _randomKeywordPool[Math.floor(Math.random() * _randomKeywordPool.length)];
    const filter: FilterItem = { id: kw.id, name: titleCase(kw.name), category: CATEGORY, mode: "include" };
    addFilter(filter);
    recordDraw("common-keyword", [filter]);
  };

  const applyRareCombo = () => {
    resetOtherUniques("rare-combo");
    clearAllFilters();
    const suggestion = keywordComboSuggestions[activeSuggestionIndex];
    const filters = comboFilters(suggestion);
    filters.forEach(f => addFilter(f));
    recordDraw("rare-combo", filters, suggestion.title);
    setActiveSuggestionIndex(i => (i + 1) % keywordComboSuggestions.length);
  };

  const applyUniqueKeyword = () => {
    clearAllFilters();
    const kw = uniqueKeywords[activeUniqueKeywordIndex];
    const filter: FilterItem = { id: kw.id, name: titleCase(kw.name), category: CATEGORY, mode: "include" };
    addFilter(filter);
    recordDraw("unique-keyword", [filter]);
    const newLimits: UniqueLimitsStore = {
      ...uniqueLimits,
      kwUsed: activeUniqueKeywordIndex + 1,
      comboUsed: 0,
      lastKwName: kw.name,
      lastKwEmoji: kw.emoji,
      lastComboTitle: undefined,
    };
    saveUniqueLimits(newLimits);
    setUniqueLimits(newLimits);
    setActiveUniqueKeywordIndex(i => (i + 1) % uniqueKeywords.length);
  };

  const applyUniqueCombo = () => {
    clearAllFilters();
    const suggestion = uniqueComboSuggestions[activeUniqueComboIndex];
    const filters = comboFilters(suggestion);
    filters.forEach(f => addFilter(f));
    recordDraw("unique-combo", filters, suggestion.title);
    const newLimits: UniqueLimitsStore = {
      ...uniqueLimits,
      kwUsed: 0,
      comboUsed: activeUniqueComboIndex + 1,
      lastKwName: undefined,
      lastKwEmoji: undefined,
      lastComboTitle: suggestion.title,
    };
    saveUniqueLimits(newLimits);
    setUniqueLimits(newLimits);
    setActiveUniqueComboIndex(i => (i + 1) % uniqueComboSuggestions.length);
  };

  const applyPopular = () => {
    resetOtherUniques("popular");
    clearAllFilters();
    const kw = popularSuggestions[activePopularIndex];
    const filter: FilterItem = { id: kw.id, name: kw.name, category: CATEGORY, mode: "include" };
    addFilter(filter);
    recordDraw("popular", [filter]);
    setActivePopularIndex(i => (i + 1) % popularSuggestions.length);
  };

  const applyUserCrafts = () => {
    resetOtherUniques("user-crafts");
    clearAllFilters();
    const filters: FilterItem[] = [
      { id: 2379, name: "Cosmic Horror", category: CATEGORY, mode: "include" },
      { id: 32, name: "Indie", category: "genres" },
    ];
    filters.forEach(f => addFilter(f));
    recordDraw("user-crafts", filters);
  };

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

  // Identify the destination: lock its game count once the preview for the
  // drawn selection is ready (or the search total, if the user searched
  // first). A short beat keeps "Charting" readable when the count is cached.
  const previewCount = selectionCount.status === 'ready' ? selectionCount.count : null;
  const previewCapped = selectionCount.status === 'ready' && selectionCount.capped;
  useEffect(() => {
    if (!relic || relic.count) return;
    let count: CountResult | null = null;
    if (previewCount !== null) count = { count: previewCount, capped: previewCapped };
    else if (searchFresh && !isLoading) count = { count: totalCount ?? gameResults.length, capped: false };
    if (!count) return;
    const locked = count;
    const id = relic.id;
    const timer = window.setTimeout(() => {
      const identify = (d: WayfinderDraw) => (d.id === id ? { ...d, count: locked } : d);
      setRelic(d => d && identify(d));
      setRelicHistory(h => h.map(identify));
    }, Math.max(0, relicDrawnAtRef.current + 750 - Date.now()));
    return () => clearTimeout(timer);
  }, [relic, previewCount, previewCapped, searchFresh, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clearing the selection resets the destination (the draw stays in the trail).
  useEffect(() => {
    if (selectedFilters.length === 0) setRelic(null);
  }, [selectedFilters.length]);

  const handleSearch = async () => {
    // Mobile: results replace the map, so go there first and watch them land.
    onShowResults?.();
    await searchGames();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: 'GameFinder', url });
    } else {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  /** Search CTA on the map's bottom-right. Fixed width across states (see kmap-relic.css).
   *  Once searched, desktop offers Share (results are beside the map); mobile offers the
   *  results view instead (Share lives in its header). */
  const renderSearchActions = () => {
    const showResults = !isDesktop && searchFresh && !isLoading;
    return (
      <button
        onClick={showResults ? onShowResults : searchFresh ? handleShare : handleSearch}
        disabled={!showResults && ((!hasSearchableFilters && !searchFresh) || zeroSelection || isLoading)}
        className={`hero-button desktop-action-button desktop-action-button-search ${
          hasSearchableFilters || searchFresh
            ? 'desktop-action-button-search-active'
            : 'desktop-action-button-search-disabled'
        } ${shareShineActive && !showResults ? 'hero-button-share-shine' : ''}${zeroSelection && !searchFresh ? ' desktop-action-button-search-zero' : ''}`}
        title={zeroSelection && !searchFresh ? 'No games match this search yet' : undefined}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Searching...
          </>
        ) : showResults ? (
          <>
            <ScrollText className="w-4 h-4" />
            {gameResults.length > 0 ? `View ${formatCount(totalCount ?? gameResults.length, countIsCapped)}` : 'Results'}
          </>
        ) : searchFresh ? (
          <>
            {shareCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {shareCopied ? 'Copied!' : 'Share'}
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            {selectionCount.status === 'ready'
              ? selectionCount.count === 0
                ? 'No matching games'
                : `Show ${formatCount(selectionCount.count, selectionCount.capped)}`
              : 'Search'}
          </>
        )}
      </button>
    );
  };

  /** "Need a spark?": six bearings on the Wayfinder. */
  const renderWayfinder = (closeSpark: () => void) => {
    // Clockwise from the top: the top three sockets are single-keyword rolls,
    // while the bottom three sockets are combination rolls.
    const bearings: WayfinderBearing[] = [
      { id: 'popular', name: 'Popular', verb: 'Roll popular', icon: Flame, group: 'keys', onDraw: applyPopular },
      { id: 'common-keyword', name: 'Any key', verb: 'Roll any key', icon: Shuffle, group: 'keys', onDraw: applyCommonKeyword },
      { id: 'unique-combo', name: 'Unique craft', verb: 'Roll unique craft', icon: WandSparkles, group: 'uniques', onDraw: applyUniqueCombo },
      { id: 'rare-combo', name: 'Curated', verb: 'Roll curated', icon: ScrollText, group: 'crafts', onDraw: applyRareCombo },
      { id: 'user-crafts', name: 'Hidden gem', verb: 'Roll hidden gem', icon: Gem, group: 'crafts', onDraw: applyUserCrafts },
      { id: 'unique-keyword', name: 'Unique key', verb: 'Roll unique key', icon: Sparkles, group: 'uniques', onDraw: applyUniqueKeyword },
    ];
    return (
      <Wayfinder
        bearings={bearings}
        destination={relic}
        history={relicHistory}
        onExplore={() => {
          track('wayfinder_follow_route', { card: relic?.card });
          closeSpark();
        }}
        onRestore={restoreRelic}
      />
    );
  };

  return (
    <div className="keyword-section relative flex w-full flex-1 flex-col">
      {/* Remounts across the breakpoint: the variant fixes the layout shape and history instance. */}
      <KeywordMap
        key={variant}
        variant={variant}
        search={<KeywordSearch inputRef={searchRef} onKeywordSelect={() => {}} />}
        spark={renderWayfinder}
        actions={renderSearchActions()}
        selection={<SelectedFilters variant="chips" onClear={clearAllFilters} />}
      />
    </div>
  );
};
