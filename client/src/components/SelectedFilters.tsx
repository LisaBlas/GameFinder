import React from "react";
import { useFilters } from "../context/FilterContext";
import { RiCloseLine } from "react-icons/ri";
import { Ban, Plus, X } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";

/** Chips pop in, glide to their new slot (avoiding moves a pill to the excludes), and shrink out. */
const CHIP_MOTION = {
  layout: "position" as const,
  initial: { opacity: 0, scale: 0.6, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.6, transition: { duration: 0.14 } },
  transition: { type: "spring" as const, stiffness: 520, damping: 34, mass: 0.7 },
};

interface SelectedFiltersProps {
  /** chips: bare pill list (includes, then excludes) that renders nothing until something is selected. */
  variant?: "wrap" | "lanes" | "chips";
  /** chips: shows a clear-all control once two or more pills are selected. */
  onClear?: () => void;
}

export const SelectedFilters: React.FC<SelectedFiltersProps> = ({ variant = "wrap", onClear }) => {
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

  const renderModeToggle = (filter: typeof selectedFilters[number]) => {
    const mode = filter.mode || "include";
    const nextMode = mode === "exclude" ? "include" : "exclude";
    const Icon = nextMode === "include" ? Plus : Ban;

    return (
      <button
        type="button"
        className="keyword-mode-chip-button"
        onClick={(event) => {
          event.stopPropagation();
          addFilter({
            ...filter,
            mode: nextMode
          });
        }}
        aria-label={`${nextMode === "include" ? "Include" : "Exclude"} ${filter.name}`}
      >
        <Icon className="keyword-mode-icon w-3.5 h-3.5" />
      </button>
    );
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
        {isKeyword && renderModeToggle(filter)}
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

  /** Chips: the whole pill removes it; the inner toggle only flips its mode. */
  const renderChip = (filter: typeof selectedFilters[number]) => {
    const remove = () => removeFilter(filter.id, filter.category, filter.endpoint);
    return (
      <motion.div
        {...CHIP_MOTION}
        key={`${filter.category}-${filter.id}`}
        className={`${getPillClassName(filter)} selected-filter-pill--removable`}
        onClick={remove}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          remove();
        }}
        aria-label={`Remove ${filter.name} filter`}
        title={`Remove ${filter.name}`}
      >
        <span className="selected-filter-name">{filter.name}</span>
        {renderModeToggle(filter)}
      </motion.div>
    );
  };

  const renderRecipePill = (filter: typeof selectedFilters[number]) => {
    return (
    <div
      key={`${filter.category}-${filter.id}`}
      className={getPillClassName(filter)}
    >
      <span className="selected-filter-name">{filter.name}</span>
      {renderModeToggle(filter)}
      <button
        type="button"
        className="selected-filter-remove"
        onClick={() => removeFilter(filter.id, filter.category, filter.endpoint)}
        aria-label={`Remove ${filter.name} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
    );
  };

  if (selectedFilters.length === 0 && !seedGame && variant === "wrap") {
    return <div className="text-text-secondary text-sm">No filters selected</div>;
  }

  if (variant === "chips") {
    // Always mounted so the last pill can animate out; CSS hides the wrapper once it's empty.
    return (
      <MotionConfig reducedMotion="user">
        <div className="selected-filter-chips" aria-label="Your search">
          <AnimatePresence initial={false} mode="popLayout">
            {includedFilters.map(renderChip)}
            {excludedFilters.map(renderChip)}
            {onClear && selectedFilters.length > 1 && (
              <motion.button
                {...CHIP_MOTION}
                key="clear-all"
                type="button"
                className="selected-filter-clear"
                onClick={onClear}
                aria-label="Clear all filters"
                title="Clear all"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>
    );
  }

  if (variant === "lanes") {
    return (
      <div className="selected-filter-recipe" aria-label="Search recipe">
        <div className="selected-filter-recipe-row">
          <div className="selected-filter-recipe-label">
            <Plus className="w-3.5 h-3.5" />
            <span>Looking for</span>
          </div>
          <div ref={includeLaneRef} className="selected-filter-lane-scroll" onWheel={handleLaneWheel}>
            {includedFilters.length > 0
              ? includedFilters.map(renderRecipePill)
              : <span className="selected-filter-empty">Add an idea from the map</span>}
          </div>
        </div>
        {excludedFilters.length > 0 && <div className="selected-filter-recipe-row selected-filter-recipe-row--avoid">
          <div className="selected-filter-recipe-label">
            <Ban className="w-3.5 h-3.5" />
            <span>Avoiding</span>
          </div>
          <div ref={excludeLaneRef} className="selected-filter-lane-scroll" onWheel={handleLaneWheel}>
            {excludedFilters.map(renderRecipePill)}
          </div>
        </div>}
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
