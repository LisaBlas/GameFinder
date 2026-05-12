import React from "react";
import { useFilters } from "../context/FilterContext";
import { RiCloseLine } from "react-icons/ri";
import { Ban, Plus } from "lucide-react";

interface SelectedFiltersProps {
  variant?: "wrap" | "lanes";
}

export const SelectedFilters: React.FC<SelectedFiltersProps> = ({ variant = "wrap" }) => {
  const { selectedFilters, removeFilter, addFilter, seedGame, clearSeedGame } = useFilters();
  const includeLaneRef = React.useRef<HTMLDivElement>(null);
  const excludeLaneRef = React.useRef<HTMLDivElement>(null);
  const includedFilters = selectedFilters.filter(filter => (filter.mode || "include") === "include");
  const excludedFilters = selectedFilters.filter(filter => filter.mode === "exclude");
  const includedFilterKey = includedFilters.map(filter => `${filter.category}-${filter.id}`).join("|");
  const excludedFilterKey = excludedFilters.map(filter => `${filter.category}-${filter.id}`).join("|");

  React.useEffect(() => {
    if (variant !== "lanes") return;

    requestAnimationFrame(() => {
      const lane = includeLaneRef.current;
      lane?.scrollTo({ left: lane.scrollWidth, behavior: "smooth" });
    });
  }, [includedFilterKey, variant]);

  React.useEffect(() => {
    if (variant !== "lanes") return;

    requestAnimationFrame(() => {
      const lane = excludeLaneRef.current;
      lane?.scrollTo({ left: lane.scrollWidth, behavior: "smooth" });
    });
  }, [excludedFilterKey, variant]);

  const handleLaneWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const lane = event.currentTarget;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || lane.scrollWidth <= lane.clientWidth) return;

    event.preventDefault();
    lane.scrollLeft += event.deltaY;
  };

  const getPillClassName = (filter: typeof selectedFilters[number]) => {
    const mode = filter.mode || "include";
    return [
      "selected-filter-pill",
      filter.category === "Keywords" && mode === "include" ? "keyword keyword-include" : "",
      mode === "exclude" ? "keyword-exclude" : "",
    ].filter(Boolean).join(" ");
  };

  const renderPill = (filter: typeof selectedFilters[number]) => {
    const isKeyword = filter.category === "Keywords";

    return (
      <div
        key={`${filter.category}-${filter.id}`}
        className={getPillClassName(filter)}
        onClick={isKeyword ? () => removeFilter(filter.id, filter.category, filter.endpoint) : undefined}
        role={isKeyword ? "button" : undefined}
        tabIndex={isKeyword ? 0 : undefined}
        onKeyDown={isKeyword ? (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            removeFilter(filter.id, filter.category, filter.endpoint);
          }
        } : undefined}
        aria-label={isKeyword ? `Remove ${filter.name} filter` : undefined}
      >
        <span className="selected-filter-name">{filter.name}</span>
        {isKeyword && (filter.mode || "include") === "include" && (
          <button
            type="button"
            className="keyword-mode-chip-button"
            onClick={(event) => {
              event.stopPropagation();
              addFilter({
                ...filter,
                mode: "exclude"
              });
            }}
            aria-label={`Exclude ${filter.name}`}
          >
            <Ban className="w-3.5 h-3.5" />
          </button>
        )}
        {!isKeyword && (
          <button
            type="button"
            className="remove-tag"
            onClick={() => removeFilter(filter.id, filter.category, filter.endpoint)}
            aria-label={`Remove ${filter.name} filter`}
          >
            <RiCloseLine />
          </button>
        )}
      </div>
    );
  };

  const renderLanePill = (filter: typeof selectedFilters[number]) => {
    const isKeyword = filter.category === "Keywords";
    return (
    <div
      key={`${filter.category}-${filter.id}`}
      className={getPillClassName(filter)}
      onClick={() => removeFilter(filter.id, filter.category, filter.endpoint)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          removeFilter(filter.id, filter.category, filter.endpoint);
        }
      }}
      aria-label={`Remove ${filter.name} filter`}
    >
      <span className="selected-filter-name">{filter.name}</span>
      {(filter.mode || "include") === "include" && (
        <button
          type="button"
          className="keyword-mode-chip-button"
          onClick={(event) => {
            event.stopPropagation();
            addFilter({
              ...filter,
              mode: "exclude"
            });
          }}
          aria-label={`Exclude ${filter.name}`}
        >
          <Ban className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
    );
  };

  if (selectedFilters.length === 0 && !seedGame && variant === "wrap") {
    return <div className="text-text-secondary text-sm">No filters selected</div>;
  }

  if (variant === "lanes") {
    return (
      <div className="selected-filter-lanes">
        <div className="selected-filter-lane">
          <div className="selected-filter-lane-mode selected-filter-lane-mode-include active">
            <Plus className="w-3.5 h-3.5" />
            INCLUDE
          </div>
          <div ref={includeLaneRef} className="selected-filter-lane-scroll" onWheel={handleLaneWheel}>
            {includedFilters.length > 0
              ? includedFilters.map(renderLanePill)
              : <span className="selected-filter-empty">No included keywords</span>
            }
          </div>
        </div>
        <div className="selected-filter-lane">
          <div className="selected-filter-lane-mode selected-filter-lane-mode-exclude active">
            <Ban className="w-3.5 h-3.5" />
            EXCLUDE
          </div>
          <div ref={excludeLaneRef} className="selected-filter-lane-scroll" onWheel={handleLaneWheel}>
            {excludedFilters.length > 0
              ? excludedFilters.map(renderLanePill)
              : <span className="selected-filter-empty">No excluded keywords</span>
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="selected-filters-container">
      {seedGame && (
        <div className="flex items-center gap-1.5 mb-1.5 px-2.5 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs text-primary w-fit">
          <span>Based on <strong>{seedGame.name}</strong></span>
          <button
            type="button"
            onClick={clearSeedGame}
            className="ml-0.5 text-primary/70 hover:text-primary transition-colors"
            aria-label="Remove seed game"
          >
            <RiCloseLine className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="selected-filters-content">
        {selectedFilters.map(renderPill)}
      </div>
    </div>
  );
};
