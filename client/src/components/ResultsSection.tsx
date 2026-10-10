import React from 'react';
import SearchResults from './SearchResults';

interface ResultsSectionProps {
  resultsSectionRef: React.RefObject<HTMLDivElement>;
  /** Mobile: return from the results view to the keyword map. */
  onBackToMap?: () => void;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ resultsSectionRef, onBackToMap }) => {
  return (
    <div
      ref={resultsSectionRef}
      className="game-results w-full px-6 pb-6 flex flex-col min-h-0 transition-all"
    >
      <div className="w-full flex flex-1 min-h-0 flex-col">
        <SearchResults onBackToMap={onBackToMap} />
      </div>
    </div>
  );
};

export default ResultsSection;
