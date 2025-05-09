import React from "react";
import { useFilters } from "../FilterContext";
import { IoGameControllerOutline } from "react-icons/io5";

export const Results: React.FC = () => {
  const { selectedFilters, gameResults, isLoading, error, sortBy, setSortBy } = useFilters();

  return (
    <div className="game-results results">
      <div className="results-header">
        <div className="results-sort">
          <span className="sort-label">Sort by:</span>
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="relevance">Relevance</option>
            <option value="name">Name</option>
            <option value="release">Release Date</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      <div className="results-content">
        {isLoading ? (
          <div className="loading-indicator">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <p>Please try different filters or try again later.</p>
          </div>
        ) : gameResults.length > 0 ? (
          <div className="results-grid">
            {gameResults.map(game => (
              <div className="game-card" key={game.id}>
                {game.cover?.url && (
                  <div className="game-image">
                    <img 
                      src={game.cover.url.replace('t_thumb', 't_cover_big')} 
                      alt={game.name} 
                      className="game-image" 
                    />
                  </div>
                )}
                <div className="game-info">
                  <div className="flex justify-between items-start">
                    <h3 className="game-title">{game.name}</h3>
                    <span>
                      {game.first_release_date 
                        ? new Date(game.first_release_date * 1000).getFullYear() 
                        : "TBA"}
                    </span>
                  </div>
                  <p className="game-description">
                    {game.summary 
                      ? game.summary.substring(0, 150) + "..." 
                      : "No description available."}
                  </p>

                  {/* Filter match information */}
                  {game._filterMatches && (
                    <div className="game-filter-info">
                      {game._filterMatches.matched.length > 0 && (
                        <div className="filter-matches">
                          <p className="matches-title">✓ Matching filters:</p>
                          <ul className="matches-list">
                            {game._filterMatches.matched.map((filter: {name: string, category: string}, idx: number) => (
                              <li key={idx}>{filter.name} ({filter.category})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {game._filterMatches.missing.length > 0 && (
                        <div className="filter-misses">
                          <p className="misses-title">✗ Missing filters:</p>
                          <ul className="misses-list">
                            {game._filterMatches.missing.map((filter: {name: string, category: string}, idx: number) => (
                              <li key={idx}>{filter.name} ({filter.category})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <IoGameControllerOutline />
            <p>Select filters and click "Search Games" to discover new games</p>
          </div>
        )}
      </div>
    </div>
  );
};
