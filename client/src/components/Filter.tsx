import React, { useEffect, useState } from "react";
import { RxCaretDown } from "react-icons/rx";
import { useFilters } from "../context/FilterContext";

interface FilterProps {
  label: string;
  id: string | number;
  category: string;
  endpoint?: string;
  slug?: string;
  isKid?: boolean;
  kids?: any[];
  hasChildren?: boolean;
  isParentOnly?: boolean;
  parentId?: string | number;
  onClick?: () => void;
}

// Define the order of categories
const CATEGORY_ORDER = [
  "platforms",
  "genres",
  "themes",
  "Game Mode",
  "Perspective"
];

export const Filter: React.FC<FilterProps> = ({ 
  label, 
  kids, 
  isKid, 
  category, 
  id, 
  slug, 
  hasChildren, 
  endpoint, 
  isParentOnly, 
  parentId,
  onClick
}) => {
  const { 
    selectedFilters, 
    addFilter, 
    removeFilter, 
    isFilterSelected,
    setFilterExpanded,
    isFilterExpanded,
    setCategoryExpanded
  } = useFilters();

  // Create a composite key using all unique identifiers
  const compositeId = `${category}-${id}-${endpoint || ''}-${slug || ''}-${label}`.toLowerCase().replace(/\s+/g, '-');

  // Check if this specific filter is selected using the full composite identity
  const isSelected = isFilterSelected(id, category, endpoint);

  // Check if any direct children of this filter are selected
  const hasSelectedChildren = kids && kids.some(kid => 
    selectedFilters.some(filter => 
      filter.id === kid.id && filter.category === category && filter.endpoint === (kid.endpoint || endpoint)
    )
  );

  // Initialize states based on current values
  const [expanded, setExpanded] = useState(false);

  // Use isSelected directly instead of local active state
  useEffect(() => {
    setExpanded(isFilterExpanded(compositeId));
  }, [isFilterExpanded, compositeId]);

  const handleClick = () => {
    let filterWasSelected = false;
    // Toggle filter selection
    if (id && id !== 'null') {
      if (!isSelected) {
        // For parent filters with isParentOnly flag, just toggle expansion without adding to filters
        if (!isParentOnly) {
          addFilter({
            id,
            name: label,
            category,
            slug,
            endpoint,
            compositeId,
            isParentOnly,
            parentId,
            isChild: !!parentId
          });
          filterWasSelected = true;
          // Call onClick callback if provided
          onClick?.();
        }
      } else {
        removeFilter(id, category, endpoint);
      }
    }

    // If this has children or is a parent filter, toggle expansion when clicked
    if (hasChildren || isParentOnly) {
      const newExpandedState = !expanded;
      setExpanded(newExpandedState);
      setFilterExpanded(compositeId, newExpandedState);
    }

    // Category auto-close/open logic (except for parent-filters in Platforms)
    if (
      filterWasSelected &&
      !(category === "platforms" && hasChildren)
    ) {
      const currentIdx = CATEGORY_ORDER.indexOf(category);
      if (currentIdx !== -1) {
        // Close current
        setCategoryExpanded(category, false);
        // Open next if exists
        const nextCategory = CATEGORY_ORDER[currentIdx + 1];
        if (nextCategory) {
          setCategoryExpanded(nextCategory, true);
        }
      }
    }
  };

  return (
    <>
      <div
        className={`filter-pill${isSelected ? " selected animate-blink" : ""}${isKid ? " kid" : ""}${(hasChildren || isParentOnly) ? " parent" : ""}${expanded ? " expanded" : ""}`}
        onClick={handleClick}
        data-composite-id={compositeId}
      >
        <span>{label}</span>
        {hasChildren && kids && kids.some(kid => kid.display !== false) && (
          <span className={`caret${expanded ? " expanded" : ""}`}>
            <RxCaretDown className="h-4 w-4" />
          </span>
        )}
      </div>

      {/* Show children if expanded */}
      {kids && (
        <div className={`filter-children${expanded ? " expanded" : ""}`}>
          {kids
            .filter(kid => kid.display !== false)
            .map(kid => {
              return (
                <Filter 
                  key={`${category}-${kid.id}-${kid.endpoint || endpoint}-${kid.slug || ""}`}
                  label={kid.name}
                  id={kid.id}
                  slug={kid.slug}
                  category={category}
                  endpoint={kid.endpoint || endpoint}
                  isKid={true}
                  kids={kid.children || []}
                  hasChildren={kid.children && kid.children.length > 0}
                  parentId={id}
                />
              );
            })}
        </div>
      )}
    </>
  );
};
