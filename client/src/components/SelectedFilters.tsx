import React from "react";
import { useFilters } from "../context/FilterContext";
import { RiCloseLine } from "react-icons/ri";

export const SelectedFilters: React.FC = () => {
  const { selectedFilters, removeFilter } = useFilters();

  if (selectedFilters.length === 0) {
    return <div className="text-text-secondary text-sm">No filters selected</div>;
  }

  return (
    <div className="selected-filters-container">
      <div className="selected-filters-content">
        {selectedFilters.map(filter => (
          <div 
            key={`${filter.category}-${filter.id}`} 
            className={`selected-filter-pill${filter.isSelected ? " selected" : ""}${filter.isKid ? " kid" : ""}`}
            onClick={() => removeFilter(filter.id, filter.category, filter.endpoint)}
            role="button"
            aria-label={`Remove ${filter.name} filter`}
          >
            {filter.name}
            <span className="remove-tag">
              <RiCloseLine />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
