import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Share2, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { SelectedFilters } from './SelectedFilters';

interface BottomBarProps {
  resetSections: () => void;
  resultsSectionRef: React.RefObject<HTMLDivElement>;
  onSearchSuccess?: () => void;
}

const BottomBar: React.FC<BottomBarProps> = ({ resetSections, resultsSectionRef, onSearchSuccess }) => {
  const { clearAllFilters, searchGames, selectedFilters, isLoading, searchFresh } = useFilters();
  const hasSearchableFilters = selectedFilters.some(filter => filter.mode !== "exclude");
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareShineActive, setShareShineActive] = useState(false);
  const prevCountRef = useRef(selectedFilters.length);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    const currCount = selectedFilters.length;

    if (currCount > 0 && prevCount === 0) {
      setIsExpanded(true);
    }
    if (currCount === 0) {
      setIsExpanded(false);
    }

    prevCountRef.current = currCount;
  }, [selectedFilters.length]);

  useEffect(() => {
    let shineStart: ReturnType<typeof setTimeout> | undefined;
    let shineEnd: ReturnType<typeof setTimeout> | undefined;

    setShareShineActive(false);

    if (searchFresh && !isLoading) {
      shineStart = setTimeout(() => setShareShineActive(true), 500);
      shineEnd = setTimeout(() => setShareShineActive(false), 2100);
    }

    return () => {
      if (shineStart) clearTimeout(shineStart);
      if (shineEnd) clearTimeout(shineEnd);
    };
  }, [searchFresh, isLoading]);

  const handleSearch = async () => {
    if (!hasSearchableFilters) return;
    setIsExpanded(false);
    onSearchSuccess?.();
    await searchGames();
    resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    resetSections();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: 'GameFinder', url });
    } else {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleClearAll = () => {
    clearAllFilters();
    resetSections();
  };

  const hasFilters = selectedFilters.length > 0;
  const includeCount = selectedFilters.filter(filter => (filter.mode || "include") === "include").length;
  const excludeCount = selectedFilters.filter(filter => filter.mode === "exclude").length;

  const translateClass = !hasFilters
    ? 'translate-y-full'
    : isExpanded
    ? 'translate-y-0'
    : 'translate-y-[calc(100%-2.75rem)]';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-2xl bg-background/95 backdrop-blur-md
        transition-transform duration-300 ease-in-out
        ${translateClass}
        ${hasFilters
          ? 'border-t border-[#f4b01b]/35 shadow-[0_-10px_32px_rgba(0,0,0,0.38),0_-1px_18px_rgba(244,176,27,0.12)]'
          : 'border-t border-border'
        }
      `}
    >
      {/* Handle bar */}
      <button
        onClick={() => hasFilters && setIsExpanded(prev => !prev)}
        className="relative w-full h-11 flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={isExpanded ? 'Collapse action bar' : 'Expand action bar'}
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-border/80" />
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 mt-1" />
        ) : (
          <>
            <span className="text-xs font-semibold mt-1 text-[#f4b01b]/80">
              {selectedFilters.length} selected
            </span>
            <span className="mt-1 flex items-center gap-1 text-[0.68rem] font-bold">
              {includeCount > 0 && (
                <span className="rounded-full border border-[#f4b01b]/55 bg-[#f4b01b]/10 px-1.5 py-0.5 text-[#ffd36a]">
                  +{includeCount}
                </span>
              )}
              {excludeCount > 0 && (
                <span className="rounded-full border border-[#ff6b74]/55 bg-[#ff6b74]/10 px-1.5 py-0.5 text-[#ffc4c7]">
                  -{excludeCount}
                </span>
              )}
            </span>
            <ChevronUp className="w-4 h-4 mt-1 text-[#f4b01b]/80" />
          </>
        )}
      </button>

      {/* Drawer content */}
      <div className="mobile-action-bar" style={{ paddingTop: 0 }}>
        <div className="mobile-action-selection">
          <SelectedFilters variant="lanes" />
        </div>

        <div className="mobile-action-buttons">
          <button
            onClick={handleClearAll}
            disabled={selectedFilters.length === 0}
            className="mobile-action-button mobile-action-button-clear"
          >
            <X className="w-4 h-4" />
            Clear
          </button>

          <button
            onClick={searchFresh ? handleShare : handleSearch}
            disabled={(!hasSearchableFilters && !searchFresh) || isLoading}
            className={`hero-button mobile-action-button mobile-action-button-search ${
              hasSearchableFilters || searchFresh
                ? 'mobile-action-button-search-active'
                : 'mobile-action-button-search-disabled'
            } ${shareShineActive ? 'hero-button-share-shine' : ''}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Searching...
              </>
            ) : searchFresh ? (
              <>
                {shareCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {shareCopied ? 'Copied!' : 'Share'}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomBar;
