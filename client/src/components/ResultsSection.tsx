import React from 'react';
import SearchResults from './SearchResults';

interface ResultsSectionProps {
  setActiveSection: (section: 'keywords' | 'results') => void;
  resultsSectionRef: React.RefObject<HTMLDivElement>;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ resultsSectionRef }) => {
  return (
    <div
      ref={resultsSectionRef}
      className="game-results w-full px-6 pb-6 flex flex-col min-h-0 transition-all"
    >
      <div className="w-full flex flex-1 min-h-0 flex-col">
        <SearchResults />
      </div>
    </div>
  );
};

export default ResultsSection;
