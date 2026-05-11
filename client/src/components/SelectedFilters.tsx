import React from "react";
import { useFilters } from "../context/FilterContext";
import { RiCloseLine } from "react-icons/ri";
import { Minus, Plus } from "lucide-react";

interface SelectedFiltersProps {
  variant?: "wrap" | "lanes";
}

export const SelectedFilters: React.FC<SelectedFiltersProps> = ({ variant = "wrap" }) => {
  const { selectedFilters, removeFilter, addFilter, keywordMode, setKeywordMode } = useFilters();

  const renderPill = (filter: typeof selectedFilters[number]) => (
    <div 
      key={`${filter.category}-${filter.id}`} 
      className={`selected-filter-pill${filter.category === "Keywords" ? ` keyword keyword-${filter.mode || "include"}` : ""}`}
    >
      {filter.category === "Keywords" && (
        <button
          type="button"
          className="keyword-mode-chip-button"
          onClick={() => addFilter({
            ...filter,
            mode: (filter.mode || "include") === "include" ? "exclude" : "include"
          })}
          aria-label={`${filter.name} is ${(filter.mode || "include") === "include" ? "included" : "excluded"}. Toggle mode.`}
        >
          {(filter.mode || "include") === "include" ? (
            <Plus className="w-3.5 h-3.5" />
          ) : (
            <Minus className="w-3.5 h-3.5" />
          )}
        </button>
      )}
      <span className="selected-filter-name">{filter.name}</span>
      <button
        type="button"
        className="remove-tag"
        onClick={() => removeFilter(filter.id, filter.category, filter.endpoint)}
        aria-label={`Remove ${filter.name} filter`}
      >
        <RiCloseLine />
      </button>
    </div>
  );

  if (selectedFilters.length === 0 && variant === "wrap") {
    return <div className="text-text-secondary text-sm">No filters selected</div>;
  }

  if (variant === "lanes") {
    const includedFilters = selectedFilters.filter(filter => (filter.mode || "include") === "include");
    const excludedFilters = selectedFilters.filter(filter => filter.mode === "exclude");

    return (
      <div className="selected-filter-lanes">
        <div className="selected-filter-lane">
          <button
            type="button"
            className={`selected-filter-lane-mode selected-filter-lane-mode-include${keywordMode === "include" ? " active" : ""}`}
            onClick={() => setKeywordMode("include")}
            aria-pressed={keywordMode === "include"}
            aria-label="Add new keywords as included"
          >
            <Plus className="w-3.5 h-3.5" />
            INCLUDE
          </button>
          <div className="selected-filter-lane-scroll">
            {includedFilters.length > 0
              ? includedFilters.map(renderPill)
              : <span className="selected-filter-empty">No included keywords</span>
            }
          </div>
        </div>
        <div className="selected-filter-lane">
          <button
            type="button"
            className={`selected-filter-lane-mode selected-filter-lane-mode-exclude${keywordMode === "exclude" ? " active" : ""}`}
            onClick={() => setKeywordMode("exclude")}
            aria-pressed={keywordMode === "exclude"}
            aria-label="Add new keywords as excluded"
          >
            <Minus className="w-3.5 h-3.5" />
            EXCLUDE
          </button>
          <div className="selected-filter-lane-scroll">
            {excludedFilters.length > 0
              ? excludedFilters.map(renderPill)
              : <span className="selected-filter-empty">No excluded keywords</span>
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="selected-filters-container">
      <div className="selected-filters-content">
        {selectedFilters.map(renderPill)}
      </div>
    </div>
  );
};
