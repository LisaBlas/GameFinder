import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
import axios from "axios";

declare const gtag: (...args: any[]) => void;
import topKeywordsByCategory from "../assets/top_keywords_by_category.json";
import extendedKeywordsByCategory from "../assets/extended_keywords_by_category.json";
import gameFilters from "../assets/game-filters.json";

const toSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const slugToKeyword: Record<string, { id: number; name: string }> = {};
[
  ...Object.values(topKeywordsByCategory as unknown as Record<string, Array<{ id: number; name: string }>>).flat(),
  ...Object.values(extendedKeywordsByCategory as unknown as Record<string, Array<{ id: number; name: string }>>).flat(),
].forEach(kw => {
  const slug = toSlug(kw.name);
  if (!slugToKeyword[slug]) slugToKeyword[slug] = { id: kw.id, name: kw.name };
});

const gf = gameFilters as Record<string, Array<{ id: number | string; name: string; isParentOnly?: boolean; children?: Array<{ id: number; name: string }> }>>;
const idToFilterName: Record<string, string> = {};
for (const items of Object.values(gf)) {
  for (const item of items) {
    if (item.children) {
      for (const child of item.children) {
        idToFilterName[String(child.id)] = child.name;
      }
    } else if (!item.isParentOnly) {
      idToFilterName[String(item.id)] = item.name;
    }
  }
}

// Define types for our filter objects
export interface Filter {
  id: string | number;
  name: string;
  category: string;
  mode?: "include" | "exclude";
  slug?: string;
  endpoint?: string;
  compositeId?: string;
  isParentOnly?: boolean;
  parentId?: string | number;
  isChild?: boolean;
}

// Define the shape of our context
interface FilterContextType {
  selectedFilters: Filter[];
  addFilter: (filter: Filter) => void;
  removeFilter: (id: string | number, category: string, endpoint?: string) => void;
  isFilterSelected: (id: string | number, category: string, endpoint?: string) => boolean;
  keywordMode: "include" | "exclude";
  setKeywordMode: (mode: "include" | "exclude") => void;
  clearAllFilters: () => void;
  expandedFilters: Record<string, boolean>;
  setFilterExpanded: (filterId: string, isExpanded: boolean) => void;
  isFilterExpanded: (filterId: string) => boolean;
  expandedCategories: Record<string, boolean>;
  setCategoryExpanded: (category: string, isExpanded: boolean) => void;
  isCategoryExpanded: (category: string) => boolean;
  gameResults: any[]; // Using any for now, should be a proper Game type in a real project
  isLoading: boolean;
  error: string | null;
  sortBy: string;
  setSortBy: (sort: string) => void;
  searchGames: () => Promise<void>;
  searchFresh: boolean;
  hasMore: boolean;
  totalCount: number | null;
  countIsCapped: boolean;
  loadMoreGames: () => Promise<void>;
  retryLoadMore: () => Promise<void>;
  seedGame: { id: number; name: string } | null;
  setSeedGame: (game: { id: number; name: string } | null) => void;
  clearSeedGame: () => void;
  requireDeveloper: boolean;
  setRequireDeveloper: (value: boolean) => void;
  requireRating: boolean;
  setRequireRating: (value: boolean) => void;
  applyFiltersAndSearch: (filters: Filter[]) => void;
  seedAndSearch: (seed: { id: number; name: string }, filters: Filter[]) => void;
  lastSearchedFilters: Filter[];
}

// Create the FilterContext with the defined type
const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Custom hook to use the context
export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  // State for selected filters
  const [selectedFilters, setSelectedFilters] = useState<Filter[]>([]);
  const [keywordMode, setKeywordMode] = useState<"include" | "exclude">("include");
  const [seedGame, setSeedGame] = useState<{ id: number; name: string } | null>(null);
  const [requireDeveloper, setRequireDeveloper] = useState<boolean>(true);
  const [requireRating, setRequireRating] = useState<boolean>(false);
  const clearSeedGame = useCallback(() => setSeedGame(null), []);
  
  // State for expanded filters
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});
  
  // State for expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    platforms: false,
    genres: false,
    themes: false,
    "Game Mode": false,
    Perspective: false,
    Keywords: false
  });
  
  // State for API results
  const [gameResults, setGameResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortByRaw] = useState<string>("relevance");
  const [searchFresh, setSearchFresh] = useState(false);
  const [lastSearchedFilters, setLastSearchedFilters] = useState<Filter[]>([]);

  const setSortBy = useCallback((sort: string) => {
    setSearchFresh(false);
    setSortByRaw(sort);
  }, []);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [countIsCapped, setCountIsCapped] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageCache, setPageCache] = useState<Record<number, any[]>>({});
  const [pendingRequests, setPendingRequests] = useState<Partial<Record<number, Promise<any>>>>({});
  const [retryCount, setRetryCount] = useState<Record<number, number>>({});
  const [lastError, setLastError] = useState<{page: number, error: any} | null>(null);
  const MAX_RETRIES = 3;
  const RESULTS_PER_PAGE = 50;
  
  // Filter management functions
  const addFilter = useCallback((filter: Filter) => {
    setSearchFresh(false);
    setSelectedFilters(prevFilters => {
      // For platforms category, only allow one selection at a time
      if (filter.category === 'platforms') {
        // Remove all existing platform filters
        const nonPlatformFilters = prevFilters.filter(f => f.category !== 'platforms');
        // Add the new platform filter
        return [...nonPlatformFilters, filter];
      }

      // For Keywords, allow multiple selections up to 3
      if (filter.category === 'Keywords') {
        const existingKeywordIndex = prevFilters.findIndex(
          f => f.category === 'Keywords' && f.id === filter.id
        );

        if (existingKeywordIndex !== -1) {
          const newFilters = [...prevFilters];
          newFilters[existingKeywordIndex] = {
            ...filter,
            mode: filter.mode || "include"
          };
          return newFilters;
        }

        return [...prevFilters, { ...filter, mode: filter.mode || "include" }];
      }

      // For other categories, maintain the existing logic
      // Check if any filter in the same category already exists
      const existingFilterIndex = prevFilters.findIndex(
        f => f.category === filter.category && !f.isChild
      );
      
      // Special case for child filters - remove parent filter if a child is selected
      if (filter.isChild && filter.parentId) {
        return [
          ...prevFilters.filter(f => 
            !(f.id === filter.parentId && f.category === filter.category)
          ),
          filter
        ];
      }
      
      // If a filter in this category exists and it's not a child, replace it
      if (existingFilterIndex !== -1 && !prevFilters[existingFilterIndex].isChild) {
        const newFilters = [...prevFilters];
        newFilters[existingFilterIndex] = filter;
        return newFilters;
      }
      
      // Otherwise, add the new filter
      return [...prevFilters, filter];
    });
  }, []);
  
  const removeFilter = useCallback((id: string | number, category: string, endpoint?: string) => {
    setSearchFresh(false);
    setSelectedFilters(prevFilters =>
      prevFilters.filter(filter => 
        !(filter.id === id && filter.category === category && filter.endpoint === endpoint)
      )
    );
  }, []);
  
  const isFilterSelected = useCallback((id: string | number, category: string, endpoint?: string) => {
    return selectedFilters.some(filter => 
      filter.id === id && filter.category === category && filter.endpoint === endpoint
    );
  }, [selectedFilters]);
  
  const clearAllFilters = useCallback(() => {
    setSearchFresh(false);
    setSelectedFilters([]);
    setExpandedFilters({});
    setExpandedCategories({
      platforms: false,
      genres: false,
      themes: false,
      "Game Mode": false,
      Perspective: false,
      Keywords: false
    });
    setSeedGame(null);
  }, []);
  
  // Filter expansion management
  const setFilterExpanded = useCallback((filterId: string, isExpanded: boolean) => {
    setExpandedFilters(prev => {
      // Create a new state object
      const newState = { ...prev };
      
      if (isExpanded) {
        // When expanding, clear all other expanded states
        Object.keys(newState).forEach(key => {
          newState[key] = false;
        });
        // Set the new filter as expanded
        newState[filterId] = true;
      } else {
        // When collapsing, just set this filter to false
        newState[filterId] = false;
      }
      
      return newState;
    });
  }, []);
  
  const isFilterExpanded = useCallback((filterId: string) => {
    return !!expandedFilters[filterId];
  }, [expandedFilters]);
  
  const setCategoryExpanded = useCallback((category: string, isExpanded: boolean) => {
    if (isExpanded) {
      // When expanding a category, collapse all other categories
      const newExpandedState: Record<string, boolean> = {};
      newExpandedState[category] = true;
      setExpandedCategories(newExpandedState);
    } else {
      // When collapsing, just update this one category
      setExpandedCategories(prev => ({
        ...prev,
        [category]: false
      }));
    }
  }, []);
  
  const isCategoryExpanded = useCallback((category: string) => {
    return !!expandedCategories[category];
  }, [expandedCategories]);
  
  // API interaction functions
  const searchGames = useCallback(async () => {
    console.log('[FilterContext] Starting search with filters:', selectedFilters);
    const searchableFilters = selectedFilters.filter(filter => filter.mode !== "exclude");

    if (searchableFilters.length === 0) {
      console.log('[FilterContext] No filters selected, aborting search');
      return;
    }

    if (typeof gtag !== 'undefined') {
      gtag('event', 'keyword_search', {
        keywords: searchableFilters.filter(f => f.category === 'Keywords').map(f => f.name).join(','),
        keyword_count: searchableFilters.filter(f => f.category === 'Keywords').length,
        total_filters: searchableFilters.length,
      });
    }

    const filtersSnapshot = [...selectedFilters];
    setSearchFresh(true);
    setIsLoading(true);
    setError(null);
    setPage(1);
    setGameResults([]);
    setHasMore(false);
    setPageCache({}); // Clear cache on new search
    setPendingRequests({}); // Clear pending requests
    setRetryCount({}); // Clear retry counts
    setLastError(null); // Clear last error
    setTotalCount(null);
    setCountIsCapped(false);
    console.log('[FilterContext] Reset page to 1, cleared cache and errors');
    
    try {
      // Group filters by category for the API
      const groupedFilters = searchableFilters.reduce<Record<string, Filter[]>>((acc, filter) => {
        if (filter.isParentOnly) return acc;
        if (!acc[filter.category]) {
          acc[filter.category] = [];
        }
        acc[filter.category].push(filter);
        return acc;
      }, {});

      const excludeKeywordIds = selectedFilters
        .filter(f => f.category === 'Keywords' && f.mode === 'exclude')
        .map(f => Number(f.id));

      const excludeFilterIds = selectedFilters
        .filter(f => f.mode === 'exclude' && f.category !== 'Keywords')
        .reduce<Record<string, number[]>>((acc, f) => {
          const key = f.category.toLowerCase().replace(/\s+/g, '_');
          if (!acc[key]) acc[key] = [];
          acc[key].push(Number(f.id));
          return acc;
        }, {});

      const response = await axios.post('/api/games/search', {
        filters: groupedFilters,
        sort: sortBy,
        page: 1,
        excludeIds: seedGame ? [seedGame.id] : [],
        excludeKeywords: excludeKeywordIds,
        excludeFilters: excludeFilterIds,
        requireDeveloper,
        requireRating
      });

      const { games: rawGames, totalCount: tc, countIsCapped: cap, hasMore: serverHasMore } = response.data;

      const processedResults = rawGames.map((game: any) => {
        const matched: Filter[] = [];
        const missing: Filter[] = [];

        searchableFilters
          .filter(filter => !filter.isParentOnly)
          .forEach(filter => {
            const matchId = game._matchedFilters?.includes(Number(filter.id));
            if (matchId) {
              matched.push(filter);
            } else {
              missing.push(filter);
            }
          });

        return {
          ...game,
          _filterMatches: {
            matched,
            missing
          }
        };
      });

      // Cache the first page results
      setPageCache(prev => ({
        ...prev,
        1: processedResults
      }));

      setGameResults(processedResults);
      setLastSearchedFilters(filtersSnapshot);
      setTotalCount(tc ?? null);
      setCountIsCapped(cap ?? false);
      setHasMore(serverHasMore ?? processedResults.length >= RESULTS_PER_PAGE);
    } catch (err: any) {
      console.error("Error searching games:", err);
      setError(err.response?.data?.message || "Failed to search games. Please try again.");
      setLastError({ page: 1, error: err });
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilters, sortBy, seedGame, requireDeveloper, requireRating]);

  const loadMoreGames = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    const nextPage = page + 1;
    console.log(`[FilterContext] Loading more games:`, {
      page: nextPage,
      currentCount: gameResults.length,
      excludeIds: gameResults.map(g => g.id)
    });
    
    // Check cache first
    if (pageCache[nextPage]) {
      console.log(`[FilterContext] Using cached results for page ${nextPage}`);
      setGameResults(prev => [...prev, ...pageCache[nextPage]]);
      setPage(nextPage);
      return;
    }
    
    // Check if there's already a pending request for this page
    if (pendingRequests[nextPage]) {
      console.log(`[FilterContext] Using existing request for page ${nextPage}`);
      return pendingRequests[nextPage];
    }
    
    setIsLoading(true);
    
    try {
      const searchableFilters = selectedFilters.filter(filter => filter.mode !== "exclude");

      // Group filters by category for the API
      const groupedFilters = searchableFilters.reduce<Record<string, Filter[]>>((acc, filter) => {
        if (!acc[filter.category]) {
          acc[filter.category] = [];
        }
        acc[filter.category].push(filter);
        return acc;
      }, {});

      const excludeKeywordIds = selectedFilters
        .filter(f => f.category === 'Keywords' && f.mode === 'exclude')
        .map(f => Number(f.id));

      const excludeFilterIds = selectedFilters
        .filter(f => f.mode === 'exclude' && f.category !== 'Keywords')
        .reduce<Record<string, number[]>>((acc, f) => {
          const key = f.category.toLowerCase().replace(/\s+/g, '_');
          if (!acc[key]) acc[key] = [];
          acc[key].push(Number(f.id));
          return acc;
        }, {});

      const excludeIds = [
        ...gameResults.map(game => game.id),
        ...(seedGame ? [seedGame.id] : [])
      ];

      const request = axios.post('/api/games/search', {
        filters: groupedFilters,
        sort: sortBy,
        page: nextPage,
        excludeIds,
        excludeKeywords: excludeKeywordIds,
        excludeFilters: excludeFilterIds,
        requireDeveloper,
        requireRating
      });
      
      setPendingRequests(prev => ({
        ...prev,
        [nextPage]: request
      }));
      
      const response = await request;
      const { games: rawGames, hasMore: serverHasMore } = response.data;
      console.log(`[FilterContext] Received response:`, {
        page: nextPage,
        newCount: rawGames.length,
        excludeCount: excludeIds.length
      });

      const processedResults = rawGames.map((game: any) => {
        const matched: Filter[] = [];
        const missing: Filter[] = [];

        searchableFilters
          .filter(filter => !filter.isParentOnly)
          .forEach(filter => {
            const matchId = game._matchedFilters?.includes(Number(filter.id));
            if (matchId) {
              matched.push(filter);
            } else {
              missing.push(filter);
            }
          });

        return {
          ...game,
          _filterMatches: {
            matched,
            missing
          }
        };
      });
      
      // Check for duplicates before updating state
      const newIds = processedResults.map((g: { id: number }) => g.id);
      const existingIds = gameResults.map((g: { id: number }) => g.id);
      const duplicates = newIds.filter((id: number) => existingIds.includes(id));
      
      if (duplicates.length > 0) {
        console.warn(`[FilterContext] Found duplicate games:`, {
          count: duplicates.length,
          ids: duplicates
        });
      }
      
      // Cache the results
      setPageCache(prev => ({
        ...prev,
        [nextPage]: processedResults
      }));
      
      // Reset retry count on success
      setRetryCount(prev => {
        const newRetries = { ...prev };
        delete newRetries[nextPage];
        return newRetries;
      });
      
      setGameResults(prev => {
        const updatedResults = [...prev, ...processedResults];
        console.log(`[FilterContext] Updated results:`, {
          previousCount: prev.length,
          newCount: processedResults.length,
          totalCount: updatedResults.length
        });
        return updatedResults;
      });
      
      setHasMore(serverHasMore ?? processedResults.length >= RESULTS_PER_PAGE);
      setPage(nextPage);
      setLastError(null);
    } catch (err: any) {
      console.error(`[FilterContext] Error loading more games:`, {
        page: nextPage,
        error: err.message
      });
      setLastError({ page: nextPage, error: err });
      
      const currentRetries = retryCount[nextPage] || 0;
      
      if (currentRetries < MAX_RETRIES) {
        setRetryCount(prev => ({
          ...prev,
          [nextPage]: currentRetries + 1
        }));
        
        setError(`Failed to load more games. Retrying... (${currentRetries + 1}/${MAX_RETRIES})`);
        
        // Retry after a delay with exponential backoff
        setTimeout(() => {
          loadMoreGames();
        }, 1000 * Math.pow(2, currentRetries));
      } else {
        setError('Failed to load more games. Please try again.');
      }
    } finally {
      // Clear the pending request
      setPendingRequests(prev => {
        const newPending = { ...prev };
        delete newPending[nextPage];
        return newPending;
      });
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, selectedFilters, sortBy, gameResults, pageCache, pendingRequests, retryCount, seedGame, requireDeveloper, requireRating]);
  
  const applyFiltersAndSearch = useCallback((filters: Filter[]) => {
    setSelectedFilters(filters);
    setSeedGame(null);
    autoSearchRef.current = true;
  }, []);

  // Set a seed game + pre-built filters simultaneously, then trigger a search.
  // Used by the "Find games like this" button in GameCard — unlike
  // applyFiltersAndSearch, this preserves the seed game so the results header
  // can show "Showing games similar to X".
  const seedAndSearch = useCallback((seed: { id: number; name: string }, filters: Filter[]) => {
    setSelectedFilters(filters);
    setSeedGame(seed);
    autoSearchRef.current = true;
  }, []);

  const retryLoadMore = useCallback(async () => {
    if (lastError) {
      setRetryCount(prev => ({
        ...prev,
        [lastError.page]: 0
      }));
      setError(null);
      await loadMoreGames();
    }
  }, [lastError, loadMoreGames]);

  const isMountedRef = useRef(false);
  const autoSearchRef = useRef(false);

  const syncToUrl = useCallback((filters: Filter[], sort: string) => {
    const params = new URLSearchParams();

    const kwInclude = filters
      .filter(f => f.category === 'Keywords' && f.mode !== 'exclude')
      .map(f => f.slug || toSlug(f.name));
    const kwExclude = filters
      .filter(f => f.category === 'Keywords' && f.mode === 'exclude')
      .map(f => f.slug || toSlug(f.name));

    if (kwInclude.length) params.set('kw', kwInclude.join(','));
    if (kwExclude.length) params.set('kw-ex', kwExclude.join(','));

    const categoryParams: Record<string, string> = {
      genres: 'genre',
      platforms: 'platform',
      themes: 'theme',
      'Game Mode': 'mode',
      Perspective: 'perspective',
    };
    for (const [cat, key] of Object.entries(categoryParams)) {
      const f = filters.find(f => f.category === cat && !f.isParentOnly);
      if (f) params.set(key, String(f.id));
    }

    if (sort && sort !== 'relevance') params.set('sort', sort);

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, []);

  // URL sync — skip the very first render so hydration can set state before we write
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    syncToUrl(selectedFilters, sortBy);
  }, [selectedFilters, sortBy, syncToUrl]);

  // Hydrate state from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return;

    const hydrated: Filter[] = [];

    const kwSlugs = params.get('kw')?.split(',').filter(Boolean) ?? [];
    const kwExSlugs = params.get('kw-ex')?.split(',').filter(Boolean) ?? [];

    kwSlugs.forEach(slug => {
      const kw = slugToKeyword[slug];
      if (kw) hydrated.push({ id: kw.id, name: kw.name, category: 'Keywords', mode: 'include', slug });
    });
    kwExSlugs.forEach(slug => {
      const kw = slugToKeyword[slug];
      if (kw) hydrated.push({ id: kw.id, name: kw.name, category: 'Keywords', mode: 'exclude', slug });
    });

    const categoryMap: Record<string, string> = {
      genre: 'genres',
      platform: 'platforms',
      theme: 'themes',
      mode: 'Game Mode',
      perspective: 'Perspective',
    };
    for (const [key, category] of Object.entries(categoryMap)) {
      const val = params.get(key);
      if (val) hydrated.push({ id: Number(val), name: idToFilterName[val] ?? val, category });
    }

    const sort = params.get('sort');
    if (sort) setSortBy(sort);

    if (hydrated.length) {
      setSelectedFilters(hydrated);
      autoSearchRef.current = true;
    }
  }, []);

  // Auto-search once after hydration from URL
  useEffect(() => {
    if (autoSearchRef.current && selectedFilters.length > 0) {
      autoSearchRef.current = false;
      searchGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters]);

  // Provide all our values and functions through the context
  const value = {
    selectedFilters,
    addFilter,
    removeFilter,
    isFilterSelected,
    keywordMode,
    setKeywordMode,
    clearAllFilters,
    expandedFilters,
    setFilterExpanded,
    isFilterExpanded,
    expandedCategories,
    setCategoryExpanded,
    isCategoryExpanded,
    gameResults,
    isLoading,
    error,
    sortBy,
    setSortBy,
    searchGames,
    searchFresh,
    hasMore,
    totalCount,
    countIsCapped,
    loadMoreGames,
    retryLoadMore,
    seedGame,
    setSeedGame,
    clearSeedGame,
    requireDeveloper,
    setRequireDeveloper,
    requireRating,
    setRequireRating,
    applyFiltersAndSearch,
    seedAndSearch,
    lastSearchedFilters,
  };
  
  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};
