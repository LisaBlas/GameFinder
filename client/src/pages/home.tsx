import React, { useState, useRef, useEffect } from 'react';
import ResultsSection from '../components/ResultsSection';
import { KeywordSection } from '../components/KeywordSection';
import { FilterProvider } from '../context/FilterContext';
import { useFilters } from '../context/FilterContext';
import BottomBar from '../components/BottomBar';
import AnimatedBackground from '../components/AnimatedBackground';
import Hero from '../components/Hero';
import Navbar from '../components/Navbar';

// Inner component to access context
const HomeContent: React.FC = () => {
  const { gameResults, isLoading } = useFilters();
  const hasResults = gameResults.length > 0 || isLoading;
  const keywordSectionRef = useRef<HTMLDivElement>(null);
  const filterSectionRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Keyword section is always visible now, so bottom bar should always show
  const [activeSection, setActiveSection] = useState<'keywords' | 'results' | 'none' | null>('keywords');
  const hasExpandedSection = true; // Always true since keyword section is always visible

  const resetSections = () => {
    setActiveSection(null);
  };

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Navbar />
      
      <main className="w-full min-h-[150vh]">
        <div className="container mx-auto px-4 lg:py-8">
          <Hero ref={heroRef} />

          {/* Full width - Keyword Section only */}
          <div className="w-full">
            <KeywordSection
              expanded={true}
              setActiveSection={setActiveSection}
              filterSectionRef={resultsSectionRef}
              heroRef={heroRef}
            />
          </div>

          {/* Results Section with integrated filters */}
          <div className="mt-8" ref={resultsSectionRef}>
            <ResultsSection
              setActiveSection={setActiveSection}
              resultsSectionRef={resultsSectionRef}
            />
          </div>
        </div>
      </main>
      {hasExpandedSection && <BottomBar resetSections={resetSections} resultsSectionRef={resultsSectionRef} />}
    </div>
  );
};

// Wrapper component to provide context
const Home: React.FC = () => {
  return (
    <FilterProvider>
      <HomeContent />
    </FilterProvider>
  );
};

export default Home;
