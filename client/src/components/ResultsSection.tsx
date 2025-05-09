import React from 'react';
import { Trophy } from 'lucide-react';
import SearchResults from './SearchResults';

interface ResultsSectionProps {
  setActiveSection: (section: 'keywords' | 'filters' | 'results') => void;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ setActiveSection }) => {
  return (
    <div 
      className="game-results bg-background w-full py-8 flex flex-col items-center justify-start text-center shadow-md transition-all relative"
    >
      <div className="w-full flex flex-col px-4 pb-24 bg-gradient-to-t from-background to-background/95">
        <SearchResults />
      </div>
    </div>
  );
};

export default ResultsSection; 