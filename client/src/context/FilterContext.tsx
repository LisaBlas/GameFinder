import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import axios from "axios";

// Define types for our filter objects
export interface Filter {
  id: string | number;
  name: string;
  category: string;
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
  hasMore: boolean;
  loadMoreGames: () => Promise<void>;
  retryLoadMore: () => Promise<void>;
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
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageCache, setPageCache] = useState<Record<number, any[]>>({});
  const [pendingRequests, setPendingRequests] = useState<Record<number, Promise<any>>>({});
  const [retryCount, setRetryCount] = useState<Record<number, number>>({});
  const [lastError, setLastError] = useState<{page: number, error: any} | null>(null);
  const MAX_RETRIES = 3;
  const RESULTS_PER_PAGE = 30;
  
  // Filter management functions
  const addFilter = useCallback((filter: Filter) => {
    setSelectedFilters(prevFilters => {
      // For platforms category, only allow one selection at a time
      if (filter.category === 'platforms') {
        // Remove all existing platform filters
        const nonPlatformFilters = prevFilters.filter(f => f.category !== 'platforms');
        // Add the new platform filter
        return [...nonPlatformFilters, filter];
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
    // Clear all selected filters
    setSelectedFilters([]);
    
    // Collapse all parent filters and categories
    setExpandedFilters({});
    
    // Reset categories to default state (all collapsed)
    setExpandedCategories({
      platforms: false,
      genres: false,
      themes: false,
      "Game Mode": false,
      Perspective: false,
      Keywords: false
    });
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
    if (selectedFilters.length === 0) {
      console.log('[FilterContext] No filters selected, aborting search');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setPage(1);
    setPageCache({}); // Clear cache on new search
    setPendingRequests({}); // Clear pending requests
    setRetryCount({}); // Clear retry counts
    setLastError(null); // Clear last error
    console.log('[FilterContext] Reset page to 1, cleared cache and errors');
    
    try {
      // Group filters by category for the API
      const groupedFilters = selectedFilters.reduce<Record<string, Filter[]>>((acc, filter) => {
        if (filter.isParentOnly) return acc;
        if (!acc[filter.category]) {
          acc[filter.category] = [];
        }
        acc[filter.category].push(filter);
        return acc;
      }, {});
      
      const response = await axios.post('/api/games/search', {
        filters: groupedFilters,
        sort: sortBy,
        page: 1
      });
      
      const processedResults = response.data.map((game: any) => {
        const matched: Filter[] = [];
        const missing: Filter[] = [];
        
        selectedFilters
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
      setHasMore(response.data.length >= RESULTS_PER_PAGE);
    } catch (err: any) {
      console.error("Error searching games:", err);
      setError(err.response?.data?.message || "Failed to search games. Please try again.");
      setLastError({ page: 1, error: err });
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilters, sortBy]);
  
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
      // Group filters by category for the API
      const groupedFilters = selectedFilters.reduce<Record<string, Filter[]>>((acc, filter) => {
        if (!acc[filter.category]) {
          acc[filter.category] = [];
        }
        acc[filter.category].push(filter);
        return acc;
      }, {});
      
      const excludeIds = gameResults.map(game => game.id);
      
      const request = axios.post('/api/games/search', {
        filters: groupedFilters,
        sort: sortBy,
        page: nextPage,
        excludeIds
      });
      
      setPendingRequests(prev => ({
        ...prev,
        [nextPage]: request
      }));
      
      const response = await request;
      console.log(`[FilterContext] Received response:`, {
        page: nextPage,
        newCount: response.data.length,
        excludeCount: excludeIds.length
      });
      
      const processedResults = response.data.map((game: any) => {
        const matched: Filter[] = [];
        const missing: Filter[] = [];
        
        selectedFilters
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
      
      setHasMore(response.data.length >= RESULTS_PER_PAGE);
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
  }, [isLoading, hasMore, page, selectedFilters, sortBy, gameResults, pageCache, pendingRequests, retryCount]);
  
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
  
  // Provide all our values and functions through the context
  const value = {
    selectedFilters,
    addFilter,
    removeFilter,
    isFilterSelected,
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
    hasMore,
    loadMoreGames,
    retryLoadMore
  };
  
  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};
