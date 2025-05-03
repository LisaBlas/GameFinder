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
    if (isExpanded) {
      // When expanding a filter, collapse all other filters
      const newExpandedState: Record<string, boolean> = {};
      newExpandedState[filterId] = true;
      setExpandedFilters(newExpandedState);
    } else {
      // When collapsing, just update this one filter
      setExpandedFilters(prev => ({
        ...prev,
        [filterId]: false
      }));
    }
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
    setPage(1); // Reset to first page for new searches
    console.log('[FilterContext] Reset page to 1, cleared errors');
    
    try {
      // Group filters by category for the API
      const groupedFilters = selectedFilters.reduce<Record<string, Filter[]>>((acc, filter) => {
        // Skip parent-only filters
        if (filter.isParentOnly) return acc;
        
        // Initialize category array if it doesn't exist
        if (!acc[filter.category]) {
          acc[filter.category] = [];
        }
        
        // Add filter to its category group
        acc[filter.category].push(filter);
        
        return acc;
      }, {});
      
      const response = await axios.post('/api/games/search', {
        filters: groupedFilters,
        sort: sortBy,
        page: 1
      });
      
      // Process the results to identify which filters matched
      const processedResults = response.data.map((game: any) => {
        // Track matched and missing filters
        const matched: Filter[] = [];
        const missing: Filter[] = [];
        
        // Go through each selected filter and check if it matched
        selectedFilters
          .filter(filter => !filter.isParentOnly) // Skip parent-only filters
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
      
      setGameResults(processedResults);
      setHasMore(response.data.length >= 30); // If we got 30 results, there might be more
    } catch (err: any) {
      console.error("Error searching games:", err);
      setError(err.response?.data?.message || "Failed to search games. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilters, sortBy]);
  
  const loadMoreGames = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    const nextPage = page + 1;
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
      
      const response = await axios.post('/api/games/search', {
        filters: groupedFilters,
        sort: sortBy,
        page: nextPage
      });
      
      // Process results like in the searchGames function
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
      
      // Append new results to existing ones
      setGameResults(prev => [...prev, ...processedResults]);
      setHasMore(response.data.length >= 30);
      setPage(nextPage);
    } catch (err: any) {
      console.error("Error loading more games:", err);
      setError(err.response?.data?.message || "Failed to load more games. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, selectedFilters, sortBy]);
  
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
    loadMoreGames
  };
  
  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};
