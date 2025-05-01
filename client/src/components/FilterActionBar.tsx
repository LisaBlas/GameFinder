import React from "react";
import { useFilters } from "../FilterContext";

export const FilterActionBar: React.FC = () => {
  const { clearAllFilters, selectedFilters, searchGames, isLoading } = useFilters();

  const handleSearch = () => {
    console.log('[FilterActionBar] Search button clicked, filters:', selectedFilters);
    searchGames();
  };

  const handleClear = () => {
    console.log('[FilterActionBar] Clear all filters clicked');
    clearAllFilters();
  };

  return (
    <div className="filter-action-bar">
      <button 
        className="clear-all-btn"
        onClick={handleClear}
        disabled={selectedFilters.length === 0}
      >
        Clear All
      </button>
      <button 
        className="search-games-btn"
        onClick={handleSearch}
        disabled={selectedFilters.length === 0 || isLoading}
      >
        {isLoading ? "Searching..." : "Search Games"}
      </button>
    </div>
  );
};