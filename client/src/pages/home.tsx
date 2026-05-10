import React, { useState, useRef } from 'react';
import ResultsSection from '../components/ResultsSection';
import { KeywordSection } from '../components/KeywordSection';
import { FilterProvider, useFilters } from '../context/FilterContext';
import BottomBar from '../components/BottomBar';
import AnimatedBackground from '../components/AnimatedBackground';

const HomeContent: React.FC = () => {
  const { gameResults } = useFilters();
  const [activeTab, setActiveTab] = useState<'build' | 'results'>('build');
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AnimatedBackground />

      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex shrink-0 border-b border-border bg-background/80 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('build')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'build'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Build
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'results'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Results
          {gameResults.length > 0 && (
            <span className="ml-1.5 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
              {gameResults.length}
            </span>
          )}
        </button>
      </div>

      {/* Workspace panels */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Build panel — mobile: active tab only, desktop: left 40% */}
        <div
          className={`bg-card flex-col overflow-y-auto w-full lg:w-2/5 lg:border-r lg:border-border ${
            activeTab === 'build' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Keyword builder */}
          <div className="flex-1">
            <KeywordSection
              expanded={true}
              setActiveSection={() => {}}
              filterSectionRef={resultsSectionRef}
              heroRef={resultsSectionRef}
            />
          </div>
        </div>

        {/* Results panel — mobile: active tab only, desktop: right 60% */}
        <div
          className={`flex-col overflow-y-auto w-full lg:flex-1 ${
            activeTab === 'results' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <ResultsSection
            setActiveSection={() => {}}
            resultsSectionRef={resultsSectionRef}
          />
        </div>
      </div>

      {/* Action bar — mobile only; desktop version lives inside the left panel */}
      <div className="lg:hidden">
        <BottomBar
          resetSections={() => {}}
          resultsSectionRef={resultsSectionRef}
          onSearchSuccess={() => setActiveTab('results')}
        />
      </div>
    </div>
  );
};

const Home: React.FC = () => (
  <FilterProvider>
    <HomeContent />
  </FilterProvider>
);

export default Home;
