import React from 'react';
import { Trophy } from 'lucide-react';
import SearchResults from './SearchResults';

interface ResultsSectionProps {
  setActiveSection: (section: 'keywords' | 'filters' | 'results') => void;
  resultsSectionRef: React.RefObject<HTMLDivElement>;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ setActiveSection, resultsSectionRef }) => {
  return (
    <div 
      ref={resultsSectionRef}
      className="game-results w-full py-8 flex flex-col items-center justify-start text-center transition-all relative"
    >
      <div className="w-full flex flex-col px-4 pb-24">
        <SearchResults />
      </div>
    </div>
  );
};

export default ResultsSection;