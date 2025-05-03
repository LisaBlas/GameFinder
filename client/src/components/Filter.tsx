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
}

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
  parentId 
}) => {
  const { 
    selectedFilters, 
    addFilter, 
    removeFilter, 
    isFilterSelected,
    setFilterExpanded,
    isFilterExpanded
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

  // Handle auto-expansion separately - only when relevant dependencies change
  useEffect(() => {
    // Only set expanded state if it needs to change
    if (hasChildren && (isSelected || hasSelectedChildren) && !expanded) {
      setExpanded(true);
      setFilterExpanded(compositeId, true);
    }
  }, [hasChildren, isSelected, hasSelectedChildren, expanded, compositeId, setFilterExpanded]);

  const handleClick = () => {
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
            parentId, // Pass parent ID for child filters
            isChild: !!parentId // Flag to identify child filters
          });
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
  };

  return (
    <>
      <div 
        className={`
          w-full px-3 py-2 rounded-md border text-sm transition-all duration-200 flex items-center justify-between
          ${isSelected 
            ? 'border-primary bg-primary/10 text-primary font-medium shadow-sm' 
            : 'border-border hover:border-muted-foreground/50 bg-card hover:bg-card/80 text-foreground cursor-pointer'}
          ${isKid ? 'ml-3 text-xs mt-1 border-dashed' : ''}
        `}
        onClick={handleClick}
        data-composite-id={compositeId}
      >
        <span className={`${isSelected ? 'font-medium' : ''}`}>{label}</span>
        {hasChildren && kids && kids.some(kid => kid.display !== false) && (
          <span className={`flex items-center transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
            <RxCaretDown className="h-4 w-4" />
          </span>
        )}
      </div>

      {/* Show children if expanded */}
      {kids && expanded && kids
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
              parentId={id} // Pass the parent ID to child filters
            />
          );
        })
      }
    </>
  );
};
