import React, { useEffect, useState } from "react";
import { RxCaretDown } from "react-icons/rx";
import { useFilters } from "../FilterContext";

interface FilterCategoryProps {
  title: string;
  children: React.ReactNode;
}

export const FilterCategory: React.FC<FilterCategoryProps> = ({title, children}) => {
  const { setCategoryExpanded, isCategoryExpanded } = useFilters();

  // Get expansion state from context
  const [expand, setExpand] = useState(isCategoryExpanded(title));

  useEffect(() => {
    const isExpanded = isCategoryExpanded(title);
    if (isExpanded !== expand) {
      setExpand(isExpanded);
    }
  }, [title, isCategoryExpanded, expand]);

  const handleClick = () => {
    const newExpandState = !expand;
    setExpand(newExpandState);
    setCategoryExpanded(title, newExpandState);
  }

  return (
    <div className="filter-category">
      <div 
        className={`filter-category-header ${expand ? 'expanded' : ''}`}
        onClick={handleClick}
      >
        <h3>{title.replaceAll('_', ' ').charAt(0).toUpperCase() + title.replaceAll('_', ' ').slice(1).toLowerCase().replace(' and ', ' & ')}</h3>
        <span className={`caret ${expand ? 'expanded' : ''}`}>
          <RxCaretDown />
        </span>
      </div>
      {expand && 
        <div className="filter-category-content">
          {children}
        </div>
      }
    </div>
  );
};
